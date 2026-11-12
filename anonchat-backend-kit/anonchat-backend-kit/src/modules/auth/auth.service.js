const bcrypt = require('bcrypt');
const { env } = require('../../config/env');
const { pool, withTransaction } = require('../../db/pool');
const { withUniqueAnonUsername } = require('../../utils/anonUsername');
const otpService = require('../../services/otpService');
const tokenService = require('../../services/tokenService');
const { invalidateUserAuthCache } = require('../../middleware/auth');
const AppError = require('../../utils/AppError');
const { toMe } = require('../users/users.serializer');

// Precomputed valid bcrypt hash used to keep login timing constant when email is unknown
const DUMMY_PASSWORD_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8g8l8fP3gQ6h7j8k9l0m1n2o3p4q5r';
const MAX_FAILED_LOGINS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

const USER_ME_COLUMNS = `id, anon_username, full_name, email, password_hash, gender, avatar_color,
  role, theme, status, status_reason, suspended_until, email_verified_at, failed_logins,
  locked_until, created_at`;

function isEmailUniqueViolation(err) {
  if (!err || err.code !== '23505') return false;
  if (err.constraint && err.constraint.includes('email')) return true;
  const text = `${err.detail || ''} ${err.message || ''}`;
  return text.includes('email');
}

async function verifyOtpWithCommit(userId, purpose, code) {
  let verification;
  await withTransaction(async (client) => {
    verification = await otpService.verifyOtp(client, { userId, purpose, code });
  });
  return verification;
}

async function register({ fullName, email, password, gender }) {
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_COST);

  const existingRes = await pool.query(`SELECT id, email_verified_at FROM users WHERE email = $1`, [
    email,
  ]);

  if (existingRes.rows.length > 0) {
    const existing = existingRes.rows[0];
    if (existing.email_verified_at) {
      // Do not reveal whether the email already exists
      return {
        message: 'If the email is eligible, a verification code has been sent.',
        email,
      };
    }

    await pool.query(
      `UPDATE users
       SET full_name = $2, password_hash = $3, gender = $4, updated_at = now()
       WHERE id = $1 AND email_verified_at IS NULL`,
      [existing.id, fullName, passwordHash, gender],
    );
    await otpService.issueAndSendOtp({
      userId: existing.id,
      email,
      purpose: 'verify_email',
    });
    return {
      message: 'Verification code sent to your email.',
      email,
    };
  }

  let createdUser;
  let createdOtp;
  try {
    await withTransaction(async (client) => {
      createdUser = await withUniqueAnonUsername(async (anonUsername) => {
        const { rows } = await client.query(
          `INSERT INTO users (anon_username, full_name, email, password_hash, gender)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, email`,
          [anonUsername, fullName, email, passwordHash, gender],
        );
        return rows[0];
      });
      createdOtp = await otpService.createOtpRecord(client, {
        userId: createdUser.id,
        purpose: 'verify_email',
      });
    });
  } catch (err) {
    if (isEmailUniqueViolation(err)) {
      return {
        message: 'If the email is eligible, a verification code has been sent.',
        email,
      };
    }
    throw err;
  }

  try {
    await otpService.sendOtp({
      email: createdUser.email,
      code: createdOtp.code,
      type: 'verify_email',
    });
  } catch (err) {
    await pool.query('DELETE FROM otp_codes WHERE id = $1', [createdOtp.id]).catch(() => {});
    throw err;
  }

  return {
    message: 'Verification code sent to your email.',
    email: createdUser.email,
  };
}

async function verifyEmail({ email, otp, userAgent }) {
  const { rows } = await pool.query(`SELECT ${USER_ME_COLUMNS} FROM users WHERE email = $1`, [
    email,
  ]);

  if (rows.length === 0) {
    throw AppError.badRequest('Invalid or expired verification code');
  }

  const user = rows[0];
  const verification = await verifyOtpWithCommit(user.id, 'verify_email', otp);
  if (!verification.valid) {
    const details = verification.invalidated ? { invalidated: true } : undefined;
    throw AppError.badRequest('Invalid or expired verification code', details);
  }

  const verifiedRes = await pool.query(
    `UPDATE users
     SET email_verified_at = COALESCE(email_verified_at, now()), updated_at = now()
     WHERE id = $1
     RETURNING ${USER_ME_COLUMNS}`,
    [user.id],
  );
  const verifiedUser = verifiedRes.rows[0];

  if (verifiedUser.status === 'banned') {
    throw AppError.forbidden('ACCOUNT_BANNED', 'Your account has been banned');
  }
  if (verifiedUser.status === 'suspended') {
    throw AppError.forbidden('ACCOUNT_SUSPENDED', 'Your account is suspended', {
      until: verifiedUser.suspended_until,
      reason: verifiedUser.status_reason,
    });
  }

  invalidateUserAuthCache(verifiedUser.id);

  const accessToken = tokenService.signAccessToken({
    userId: verifiedUser.id,
    role: verifiedUser.role,
  });
  const issuedRefresh = await tokenService.issueRefreshToken(pool, {
    userId: verifiedUser.id,
    userAgent,
  });

  return {
    accessToken,
    refreshToken: issuedRefresh.refreshToken,
    user: toMe(verifiedUser),
  };
}

async function resendOtp({ email }) {
  const { rows } = await pool.query(`SELECT id, email_verified_at FROM users WHERE email = $1`, [
    email,
  ]);

  if (rows.length > 0 && !rows[0].email_verified_at) {
    await otpService.issueAndSendOtp({
      userId: rows[0].id,
      email,
      purpose: 'verify_email',
    });
  }

  return {
    message: 'If the account exists and is unverified, a verification code has been sent.',
  };
}

async function login({ email, password, userAgent }) {
  const { rows } = await pool.query(`SELECT ${USER_ME_COLUMNS} FROM users WHERE email = $1`, [
    email,
  ]);

  const user = rows[0] || null;
  const passwordMatch = await bcrypt.compare(
    password,
    user ? user.password_hash : DUMMY_PASSWORD_HASH,
  );

  if (user && user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
    const retryAfter = Math.max(
      1,
      Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 1000),
    );
    throw AppError.rateLimited(
      'RATE_LIMITED',
      'Account temporarily locked due to failed login attempts',
      { retryAfter },
    );
  }

  if (!user || !passwordMatch) {
    if (user) {
      const nextFailed = user.failed_logins + 1;
      const shouldLock = nextFailed >= MAX_FAILED_LOGINS;
      const lockedUntil = shouldLock ? new Date(Date.now() + LOCK_DURATION_MS).toISOString() : null;
      await pool.query(
        `UPDATE users
         SET failed_logins = $2,
             locked_until = $3,
             updated_at = now()
         WHERE id = $1`,
        [user.id, shouldLock ? 0 : nextFailed, lockedUntil],
      );
    }
    throw AppError.unauthenticated('Invalid email or password');
  }

  if (user.failed_logins > 0 || user.locked_until) {
    await pool.query(
      `UPDATE users SET failed_logins = 0, locked_until = NULL, updated_at = now() WHERE id = $1`,
      [user.id],
    );
  }

  if (!user.email_verified_at) {
    await otpService.issueAndSendOtp({
      userId: user.id,
      email: user.email,
      purpose: 'verify_email',
    });
    throw AppError.forbidden(
      'EMAIL_NOT_VERIFIED',
      'Email is not verified. A new verification code has been sent.',
    );
  }

  if (user.status === 'banned') {
    throw AppError.forbidden('ACCOUNT_BANNED', 'Your account has been banned');
  }

  if (user.status === 'suspended') {
    const expired = user.suspended_until && new Date(user.suspended_until).getTime() <= Date.now();
    if (expired) {
      await pool.query(
        `UPDATE users
         SET status = 'active', suspended_until = NULL, status_reason = NULL, updated_at = now()
         WHERE id = $1 AND status = 'suspended'`,
        [user.id],
      );
      invalidateUserAuthCache(user.id);
    } else {
      throw AppError.forbidden('ACCOUNT_SUSPENDED', 'Your account is suspended', {
        until: user.suspended_until,
        reason: user.status_reason,
      });
    }
  }

  const accessToken = tokenService.signAccessToken({ userId: user.id, role: user.role });
  const issuedRefresh = await tokenService.issueRefreshToken(pool, {
    userId: user.id,
    userAgent,
  });

  return {
    accessToken,
    refreshToken: issuedRefresh.refreshToken,
    user: toMe(user),
  };
}

async function refresh({ rawToken, userAgent }) {
  if (!rawToken) {
    throw AppError.unauthenticated('Refresh token is required');
  }
  return tokenService.rotateRefreshToken({ rawToken, userAgent });
}

async function logout({ rawToken }) {
  if (rawToken) {
    await tokenService.revokeRefreshToken(rawToken);
  }
}

async function forgotPassword({ email }) {
  const { rows } = await pool.query(
    `SELECT id, status, email_verified_at FROM users WHERE email = $1`,
    [email],
  );

  if (rows.length > 0 && rows[0].email_verified_at && rows[0].status !== 'banned') {
    await otpService.issueAndSendOtp({
      userId: rows[0].id,
      email,
      purpose: 'reset_password',
    });
  }

  return {
    message: 'If an account with that email exists, a password reset code has been sent.',
  };
}

async function resetPassword({ email, otp, newPassword }) {
  const { rows } = await pool.query(`SELECT id, status FROM users WHERE email = $1`, [email]);
  if (rows.length === 0 || rows[0].status === 'banned') {
    throw AppError.badRequest('Invalid or expired password reset code');
  }

  const user = rows[0];
  const verification = await verifyOtpWithCommit(user.id, 'reset_password', otp);
  if (!verification.valid) {
    const details = verification.invalidated ? { invalidated: true } : undefined;
    throw AppError.badRequest('Invalid or expired password reset code', details);
  }

  const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_COST);
  await withTransaction(async (client) => {
    await client.query(
      `UPDATE users
       SET password_hash = $2, failed_logins = 0, locked_until = NULL, updated_at = now()
       WHERE id = $1`,
      [user.id, passwordHash],
    );
    await tokenService.revokeAllUserRefreshTokens(user.id, { db: client });
  });

  invalidateUserAuthCache(user.id);
  return { message: 'Password reset successful' };
}

module.exports = {
  register,
  verifyEmail,
  resendOtp,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
};

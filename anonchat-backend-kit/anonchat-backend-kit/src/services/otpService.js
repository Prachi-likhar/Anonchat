const crypto = require('crypto');
const axios = require('axios');
const { env } = require('../config/env');
const { pool } = require('../db/pool');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const MAX_OTP_ATTEMPTS = 5;

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(code, userId) {
  return crypto.createHash('sha256').update(`${code}:${userId}:${env.OTP_PEPPER}`).digest('hex');
}

/**
 * Consumes previous active OTPs of the same purpose and inserts a fresh hashed OTP row.
 */
async function createOtpRecord(db, { userId, purpose }) {
  const code = generateOtp();
  const codeHash = hashOtp(code, userId);
  const expiresAt = new Date(Date.now() + env.OTP_TTL_MIN * 60 * 1000);

  await db.query(
    `UPDATE otp_codes
     SET consumed_at = now()
     WHERE user_id = $1 AND purpose = $2 AND consumed_at IS NULL`,
    [userId, purpose],
  );

  const { rows } = await db.query(
    `INSERT INTO otp_codes (user_id, purpose, code_hash, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING id, expires_at`,
    [userId, purpose, codeHash, expiresAt.toISOString()],
  );

  return {
    id: rows[0].id,
    code,
    expiresAt: rows[0].expires_at,
  };
}

/**
 * Sends a 6-digit OTP via Google Apps Script Web App, or prints DEV ONLY in development when URL is empty.
 */
async function sendOtp({
  email,
  code,
  type,
  appsScriptUrl = env.APPS_SCRIPT_URL,
  appsScriptSecret = env.APPS_SCRIPT_SECRET,
}) {
  if (!appsScriptUrl) {
    if (env.NODE_ENV === 'production') {
      throw new AppError(503, 'EMAIL_SERVICE_UNAVAILABLE', 'Email service is not configured');
    }
    if (env.NODE_ENV === 'development') {
      console.warn(`[DEV ONLY] OTP (${type}): ${code}`);
    }
    return { ok: true, devFallback: true };
  }

  try {
    const response = await axios.post(
      appsScriptUrl,
      {
        secret: appsScriptSecret,
        type,
        to: email,
        code,
        ttlMin: env.OTP_TTL_MIN,
      },
      {
        timeout: 10000,
        maxRedirects: 5,
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (!response.data || response.data.ok !== true) {
      logger.error(
        { type, scriptError: response.data?.error || 'unknown' },
        'Apps Script OTP delivery returned non-ok response',
      );
      throw new AppError(
        503,
        'EMAIL_SERVICE_UNAVAILABLE',
        'Unable to send verification email right now',
      );
    }

    return { ok: true };
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    logger.error({ type, status: err.response?.status }, 'Apps Script OTP request failed');
    throw new AppError(
      503,
      'EMAIL_SERVICE_UNAVAILABLE',
      'Unable to send verification email right now',
    );
  }
}

/**
 * Creates a new OTP row and dispatches it. Deletes the OTP row if email delivery fails.
 */
async function issueAndSendOtp({
  db = pool,
  userId,
  email,
  purpose,
  appsScriptUrl,
  appsScriptSecret,
}) {
  const record = await createOtpRecord(db, { userId, purpose });
  try {
    await sendOtp({
      email,
      code: record.code,
      type: purpose,
      appsScriptUrl,
      appsScriptSecret,
    });
    return { id: record.id, expiresAt: record.expiresAt };
  } catch (err) {
    await db.query('DELETE FROM otp_codes WHERE id = $1', [record.id]).catch(() => {});
    throw err;
  }
}

/**
 * Verifies the latest unconsumed OTP for (userId, purpose) using constant-time comparison.
 * Increments attempts on mismatch and invalidates the code after 5 wrong tries.
 */
async function verifyOtp(db, { userId, purpose, code }) {
  const { rows } = await db.query(
    `SELECT id, code_hash, attempts, expires_at
     FROM otp_codes
     WHERE user_id = $1 AND purpose = $2 AND consumed_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1
     FOR UPDATE`,
    [userId, purpose],
  );

  if (rows.length === 0) {
    return { valid: false, reason: 'NO_ACTIVE_OTP', invalidated: false };
  }

  const row = rows[0];
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await db.query('UPDATE otp_codes SET consumed_at = now() WHERE id = $1', [row.id]);
    return { valid: false, reason: 'EXPIRED_OTP', invalidated: true };
  }

  if (row.attempts >= MAX_OTP_ATTEMPTS) {
    await db.query('UPDATE otp_codes SET consumed_at = now() WHERE id = $1', [row.id]);
    return { valid: false, reason: 'MAX_ATTEMPTS', invalidated: true };
  }

  const expectedBuf = Buffer.from(row.code_hash, 'hex');
  const candidateBuf = Buffer.from(hashOtp(code, userId), 'hex');
  const match =
    expectedBuf.length === candidateBuf.length && crypto.timingSafeEqual(expectedBuf, candidateBuf);

  if (!match) {
    const nextAttempts = row.attempts + 1;
    const invalidated = nextAttempts >= MAX_OTP_ATTEMPTS;
    await db.query(
      `UPDATE otp_codes
       SET attempts = $2,
           consumed_at = CASE WHEN $3 THEN now() ELSE NULL END
       WHERE id = $1`,
      [row.id, nextAttempts, invalidated],
    );
    return { valid: false, reason: 'INVALID_OTP', invalidated };
  }

  await db.query('UPDATE otp_codes SET consumed_at = now() WHERE id = $1', [row.id]);
  return { valid: true, otpId: row.id };
}

module.exports = {
  MAX_OTP_ATTEMPTS,
  generateOtp,
  hashOtp,
  createOtpRecord,
  sendOtp,
  issueAndSendOtp,
  verifyOtp,
};

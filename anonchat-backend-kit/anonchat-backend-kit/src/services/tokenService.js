const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { env } = require('../config/env');
const { pool, withTransaction } = require('../db/pool');
const AppError = require('../utils/AppError');

function signAccessToken({ userId, role }) {
  return jwt.sign({ sub: userId, role }, env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.ACCESS_TTL,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
}

function generateOpaqueRefreshToken() {
  return crypto.randomBytes(48).toString('base64url');
}

function hashRefreshToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

async function issueRefreshToken(db, { userId, familyId = uuidv4(), userAgent = null }) {
  const refreshToken = generateOpaqueRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);
  const expiresAt = new Date(Date.now() + env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

  const { rows } = await db.query(
    `INSERT INTO refresh_tokens (user_id, family_id, token_hash, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, family_id, expires_at`,
    [userId, familyId, tokenHash, userAgent, expiresAt.toISOString()],
  );

  return {
    tokenId: rows[0].id,
    familyId: rows[0].family_id,
    expiresAt: rows[0].expires_at,
    refreshToken,
  };
}

/**
 * Rotates an opaque refresh token.
 * If a revoked token is presented, revokes the entire token family (theft detection) and rejects with 401.
 */
async function rotateRefreshToken({ rawToken, userAgent = null, txRunner = withTransaction }) {
  const tokenHash = hashRefreshToken(rawToken);
  let outcomeError = null;
  let result = null;

  await txRunner(async (client) => {
    const { rows } = await client.query(
      `SELECT rt.id, rt.user_id, rt.family_id, rt.expires_at, rt.revoked_at,
              u.role, u.status, u.suspended_until, u.status_reason, u.email_verified_at
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1
       FOR UPDATE OF rt`,
      [tokenHash],
    );

    if (rows.length === 0) {
      outcomeError = AppError.unauthenticated('Invalid refresh token');
      return;
    }

    const row = rows[0];

    if (row.revoked_at !== null) {
      // Reuse of a rotated/revoked token: revoke the entire family in DB before throwing
      await client.query(
        `UPDATE refresh_tokens
         SET revoked_at = COALESCE(revoked_at, now())
         WHERE family_id = $1`,
        [row.family_id],
      );
      outcomeError = AppError.unauthenticated('Refresh token reuse detected');
      return;
    }

    if (new Date(row.expires_at).getTime() <= Date.now()) {
      await client.query('UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1', [row.id]);
      outcomeError = AppError.unauthenticated('Refresh token expired');
      return;
    }

    if (row.status === 'banned') {
      outcomeError = AppError.forbidden('ACCOUNT_BANNED', 'Your account has been banned');
      return;
    }

    if (row.status === 'suspended') {
      const stillSuspended =
        !row.suspended_until || new Date(row.suspended_until).getTime() > Date.now();
      if (stillSuspended) {
        outcomeError = AppError.forbidden('ACCOUNT_SUSPENDED', 'Your account is suspended', {
          until: row.suspended_until,
          reason: row.status_reason,
        });
        return;
      }
      await client.query(
        `UPDATE users
         SET status = 'active', suspended_until = NULL, status_reason = NULL, updated_at = now()
         WHERE id = $1 AND status = 'suspended'`,
        [row.user_id],
      );
    }

    if (!row.email_verified_at) {
      outcomeError = AppError.forbidden('EMAIL_NOT_VERIFIED', 'Email address is not verified');
      return;
    }

    const next = await issueRefreshToken(client, {
      userId: row.user_id,
      familyId: row.family_id,
      userAgent,
    });

    await client.query(
      `UPDATE refresh_tokens
       SET revoked_at = now(), replaced_by = $2
       WHERE id = $1`,
      [row.id, next.tokenId],
    );

    const accessToken = signAccessToken({ userId: row.user_id, role: row.role });
    result = {
      accessToken,
      refreshToken: next.refreshToken,
      expiresAt: next.expiresAt,
      userId: row.user_id,
      role: row.role,
    };
  });

  if (outcomeError) {
    throw outcomeError;
  }
  return result;
}

async function revokeRefreshToken(rawToken, db = pool) {
  if (!rawToken) return;
  const tokenHash = hashRefreshToken(rawToken);
  await db.query(
    `UPDATE refresh_tokens
     SET revoked_at = COALESCE(revoked_at, now())
     WHERE token_hash = $1`,
    [tokenHash],
  );
}

async function revokeAllUserRefreshTokens(userId, { exceptRawToken = null, db = pool } = {}) {
  if (exceptRawToken) {
    const exceptHash = hashRefreshToken(exceptRawToken);
    await db.query(
      `UPDATE refresh_tokens
       SET revoked_at = COALESCE(revoked_at, now())
       WHERE user_id = $1 AND token_hash <> $2 AND revoked_at IS NULL`,
      [userId, exceptHash],
    );
    return;
  }

  await db.query(
    `UPDATE refresh_tokens
     SET revoked_at = COALESCE(revoked_at, now())
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId],
  );
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  generateOpaqueRefreshToken,
  hashRefreshToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
};


const { pool } = require('../db/pool');
const { verifyAccessToken } = require('../services/tokenService');
const AppError = require('../utils/AppError');

const CACHE_TTL_MS = 15 * 1000;
const authCache = new Map();

function invalidateUserAuthCache(userId) {
  if (userId) {
    authCache.delete(userId);
  }
}

function clearAuthCache() {
  authCache.clear();
}

async function loadUserAuthState(userId, db = pool) {
  const cached = authCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    const expiredSuspension =
      cached.data.status === 'suspended' &&
      cached.data.suspended_until &&
      new Date(cached.data.suspended_until).getTime() <= Date.now();
    if (!expiredSuspension) {
      return cached.data;
    }
    authCache.delete(userId);
  }

  const { rows } = await db.query(
    `SELECT id, role, status, suspended_until, status_reason, email_verified_at
     FROM users
     WHERE id = $1`,
    [userId],
  );

  if (rows.length === 0) {
    return null;
  }

  let user = rows[0];
  if (
    user.status === 'suspended' &&
    user.suspended_until &&
    new Date(user.suspended_until).getTime() <= Date.now()
  ) {
    const lifted = await db.query(
      `UPDATE users
       SET status = 'active', suspended_until = NULL, status_reason = NULL, updated_at = now()
       WHERE id = $1 AND status = 'suspended' AND suspended_until <= now()
       RETURNING id, role, status, suspended_until, status_reason, email_verified_at`,
      [userId],
    );
    if (lifted.rows.length > 0) {
      user = lifted.rows[0];
    }
  }

  authCache.set(userId, {
    data: user,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return user;
}

/**
 * Verifies Bearer access JWT and validates live account status from DB (with 15s cache).
 */
async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return next(AppError.unauthenticated('Missing or invalid authorization header'));
    }

    const token = header.slice(7).trim();
    if (!token) {
      return next(AppError.unauthenticated('Missing access token'));
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      return next(AppError.unauthenticated('Invalid or expired access token'));
    }

    if (!payload || !payload.sub) {
      return next(AppError.unauthenticated('Invalid access token payload'));
    }

    const user = await loadUserAuthState(payload.sub);
    if (!user) {
      return next(AppError.unauthenticated('Account no longer exists'));
    }

    if (user.status === 'banned') {
      return next(AppError.forbidden('ACCOUNT_BANNED', 'Your account has been banned'));
    }

    if (user.status === 'suspended') {
      return next(
        AppError.forbidden('ACCOUNT_SUSPENDED', 'Your account is suspended', {
          until: user.suspended_until,
          reason: user.status_reason,
        }),
      );
    }

    if (!user.email_verified_at) {
      return next(AppError.forbidden('EMAIL_NOT_VERIFIED', 'Email address is not verified'));
    }

    req.user = { id: user.id, role: user.role };
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  authenticate,
  loadUserAuthState,
  invalidateUserAuthCache,
  clearAuthCache,
};

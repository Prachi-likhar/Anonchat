const bcrypt = require('bcrypt');
const { env } = require('../../config/env');
const { pool, withTransaction } = require('../../db/pool');
const tokenService = require('../../services/tokenService');
const { invalidateUserAuthCache } = require('../../middleware/auth');
const { emitForceLogout } = require('../../sockets/emitter');
const AppError = require('../../utils/AppError');
const { toMe } = require('./users.serializer');

const ME_COLUMNS = `id, anon_username, full_name, email, gender, avatar_color, role, theme, created_at`;

async function getMe(userId) {
  const { rows } = await pool.query(`SELECT ${ME_COLUMNS} FROM users WHERE id = $1`, [userId]);
  if (rows.length === 0) {
    throw AppError.unauthenticated('Account not found');
  }
  return toMe(rows[0]);
}

async function updateMe(userId, updates) {
  const fields = [];
  const values = [];

  const columnMap = {
    fullName: 'full_name',
    gender: 'gender',
    avatarColor: 'avatar_color',
    theme: 'theme',
  };

  for (const [key, column] of Object.entries(columnMap)) {
    if (updates[key] !== undefined) {
      values.push(updates[key]);
      fields.push(`${column} = $${values.length}`);
    }
  }

  if (fields.length === 0) {
    return getMe(userId);
  }

  values.push(userId);
  const { rows } = await pool.query(
    `UPDATE users
     SET ${fields.join(', ')}, updated_at = now()
     WHERE id = $${values.length}
     RETURNING ${ME_COLUMNS}`,
    values,
  );

  if (rows.length === 0) {
    throw AppError.unauthenticated('Account not found');
  }

  return toMe(rows[0]);
}

async function changePassword(userId, { currentPassword, newPassword, currentRefreshToken }) {
  const { rows } = await pool.query(`SELECT id, password_hash FROM users WHERE id = $1`, [userId]);
  if (rows.length === 0) {
    throw AppError.unauthenticated('Account not found');
  }

  const matches = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!matches) {
    throw AppError.badRequest('Current password is incorrect');
  }

  const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_COST);

  await withTransaction(async (client) => {
    await client.query(`UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1`, [
      userId,
      passwordHash,
    ]);
    await tokenService.revokeAllUserRefreshTokens(userId, {
      exceptRawToken: currentRefreshToken || null,
      db: client,
    });
  });

  invalidateUserAuthCache(userId);
  emitForceLogout({ userId, reason: 'password-changed' });
}

async function deleteMe(userId, { password }) {
  const { rows } = await pool.query(`SELECT id, password_hash FROM users WHERE id = $1`, [userId]);
  if (rows.length === 0) {
    throw AppError.unauthenticated('Account not found');
  }

  const matches = await bcrypt.compare(password, rows[0].password_hash);
  if (!matches) {
    throw AppError.badRequest('Password is incorrect');
  }

  await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
  invalidateUserAuthCache(userId);
}

module.exports = {
  getMe,
  updateMe,
  changePassword,
  deleteMe,
};

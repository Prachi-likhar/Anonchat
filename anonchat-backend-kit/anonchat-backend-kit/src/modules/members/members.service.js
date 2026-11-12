const { pool } = require('../../db/pool');
const presenceService = require('../../services/presenceService');
const { toPublicMember } = require('../users/users.serializer');
const { decodeCursor, escapeLike, slicePage } = require('../../utils/pagination');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidMemberCursor(obj) {
  return (
    typeof obj.anonUsername === 'string' &&
    obj.anonUsername.length > 0 &&
    typeof obj.id === 'string' &&
    UUID_REGEX.test(obj.id)
  );
}

/**
 * Lists discoverable verified, active, non-admin members excluding self and two-way blocks.
 */
async function listMembers(meId, { filter = 'all', search = '', limit = 20, cursor }) {
  const decodedCursor = decodeCursor(cursor, isValidMemberCursor);

  const conditions = [
    'u.id <> $1',
    "u.status = 'active'",
    'u.email_verified_at IS NOT NULL',
    "u.role <> 'admin'",
    `NOT EXISTS (
      SELECT 1 FROM blocks b
      WHERE (b.blocker_id = $1 AND b.blocked_id = u.id)
         OR (b.blocker_id = u.id AND b.blocked_id = $1)
    )`,
  ];
  const params = [meId];

  if (filter === 'male' || filter === 'female') {
    params.push(filter);
    conditions.push(`u.gender = $${params.length}`);
  } else if (filter === 'online') {
    const onlineIds = presenceService.getOnlineUserIds().filter((id) => id !== meId);
    if (onlineIds.length === 0) {
      return { items: [], nextCursor: null };
    }
    params.push(onlineIds);
    conditions.push(`u.id = ANY($${params.length}::uuid[])`);
  }

  if (search) {
    params.push(`%${escapeLike(search)}%`);
    conditions.push(`u.anon_username ILIKE $${params.length} ESCAPE '\\'`);
  }

  if (decodedCursor) {
    params.push(decodedCursor.anonUsername, decodedCursor.id);
    conditions.push(`(u.anon_username, u.id) > ($${params.length - 1}, $${params.length})`);
  }

  params.push(limit + 1);
  const { rows } = await pool.query(
    `SELECT u.id, u.anon_username, u.gender, u.avatar_color
     FROM users u
     WHERE ${conditions.join(' AND ')}
     ORDER BY u.anon_username ASC, u.id ASC
     LIMIT $${params.length}`,
    params,
  );

  const page = slicePage(rows, limit, (lastRow) => ({
    anonUsername: lastRow.anon_username,
    id: lastRow.id,
  }));

  return {
    items: page.rows.map((row) =>
      toPublicMember(row, {
        isOnline: presenceService.isOnline(row.id),
        blockedByMe: false,
      }),
    ),
    nextCursor: page.nextCursor,
  };
}

module.exports = {
  listMembers,
};


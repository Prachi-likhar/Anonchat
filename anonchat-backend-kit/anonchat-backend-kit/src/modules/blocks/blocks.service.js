const { pool, withTransaction } = require('../../db/pool');
const { toPublicMember } = require('../users/users.serializer');
const { emitConversationEnded } = require('../../sockets/emitter');
const AppError = require('../../utils/AppError');

/**
 * Blocks a member and ends any active conversation between the pair inside one transaction.
 * @returns {Promise<{ endedConversationIds: string[] }>}
 */
async function blockMember(meId, targetMemberId) {
  if (meId === targetMemberId) {
    throw AppError.badRequest('Cannot block yourself');
  }

  const [userA, userB] = [meId, targetMemberId].sort();
  let endedConversationIds = [];

  await withTransaction(async (client) => {
    const targetRes = await client.query(`SELECT id FROM users WHERE id = $1 AND role <> 'admin'`, [
      targetMemberId,
    ]);
    if (targetRes.rows.length === 0) {
      throw AppError.notFound('Member not found');
    }

    await client.query(
      `INSERT INTO blocks (blocker_id, blocked_id)
       VALUES ($1, $2)
       ON CONFLICT (blocker_id, blocked_id) DO NOTHING`,
      [meId, targetMemberId],
    );

    const endedRes = await client.query(
      `UPDATE conversations
       SET status = 'ended', ended_by = $3
       WHERE user_a = $1 AND user_b = $2 AND status = 'active'
       RETURNING id`,
      [userA, userB, meId],
    );
    endedConversationIds = endedRes.rows.map((r) => r.id);
  });

  for (const conversationId of endedConversationIds) {
    emitConversationEnded({ conversationId, userA, userB });
  }

  return { endedConversationIds };
}

async function unblockMember(meId, targetMemberId) {
  await pool.query(`DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2`, [
    meId,
    targetMemberId,
  ]);
}

async function listBlockedMembers(meId) {
  const { rows } = await pool.query(
    `SELECT u.id, u.anon_username, u.gender, u.avatar_color
     FROM blocks b
     JOIN users u ON u.id = b.blocked_id
     WHERE b.blocker_id = $1 AND u.role <> 'admin'
     ORDER BY b.created_at DESC, u.id ASC`,
    [meId],
  );

  return {
    items: rows.map((row) =>
      toPublicMember(row, {
        isOnline: false,
        blockedByMe: true,
      }),
    ),
  };
}

module.exports = {
  blockMember,
  unblockMember,
  listBlockedMembers,
};

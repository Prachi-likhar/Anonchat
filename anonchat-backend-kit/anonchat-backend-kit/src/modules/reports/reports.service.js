const { pool } = require('../../db/pool');
const AppError = require('../../utils/AppError');
const { canonicalPair } = require('../conversations/conversations.serializer');

const SNAPSHOT_LIMIT = 30;

/**
 * Creates a moderation report and captures a snapshot of the last 30 messages
 * if a conversationId is provided and the reporter is a participant.
 */
async function createReport(meId, { memberId, conversationId, reason, details }) {
  if (meId === memberId) {
    throw AppError.badRequest('Cannot report yourself');
  }

  const targetRes = await pool.query(`SELECT id FROM users WHERE id = $1 AND role <> 'admin'`, [
    memberId,
  ]);
  if (targetRes.rows.length === 0) {
    throw AppError.notFound('Member not found');
  }

  let snapshot = null;
  if (conversationId) {
    const [userA, userB] = canonicalPair(meId, memberId);
    const convoRes = await pool.query(
      `SELECT id FROM conversations
       WHERE id = $1 AND user_a = $2 AND user_b = $3`,
      [conversationId, userA, userB],
    );
    if (convoRes.rows.length === 0) {
      throw AppError.notFound('Conversation not found');
    }

    const msgRes = await pool.query(
      `SELECT u.anon_username AS sender, m.body, m.created_at AS at
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at DESC, m.id DESC
       LIMIT $2`,
      [conversationId, SNAPSHOT_LIMIT],
    );

    snapshot = msgRes.rows.reverse().map((row) => ({
      sender: row.sender,
      body: row.body,
      at: new Date(row.at).toISOString(),
    }));
  }

  const { rows } = await pool.query(
    `INSERT INTO reports (reporter_id, reported_id, conversation_id, reason, details, snapshot)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      meId,
      memberId,
      conversationId || null,
      reason,
      details || null,
      snapshot ? JSON.stringify(snapshot) : null,
    ],
  );

  return { id: rows[0].id };
}

module.exports = {
  createReport,
};

const { env } = require('../../config/env');
const { pool, withTransaction } = require('../../db/pool');
const antiSpam = require('../../services/antiSpam');
const {
  getIo,
  emitMessageNew,
  emitMessageRead,
  emitConversationEnded,
} = require('../../sockets/emitter');
const AppError = require('../../utils/AppError');
const { decodeCursor, slicePage } = require('../../utils/pagination');
const { canonicalPair, toConversation, toMessage } = require('./conversations.serializer');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidTimeIdCursor(obj) {
  return (
    typeof obj.ts === 'string' &&
    !Number.isNaN(Date.parse(obj.ts)) &&
    typeof obj.id === 'string' &&
    UUID_REGEX.test(obj.id)
  );
}

const CONVERSATION_SELECT = `
  SELECT
    c.id,
    c.user_a,
    c.user_b,
    c.initiated_by,
    c.status,
    c.ended_by,
    c.last_message_at,
    c.created_at,
    other.id AS other_id,
    other.anon_username AS other_anon_username,
    other.gender AS other_gender,
    other.avatar_color AS other_avatar_color,
    lm.id AS last_msg_id,
    lm.body AS last_msg_body,
    lm.created_at AS last_msg_created_at,
    lm.sender_id AS last_msg_sender_id,
    EXISTS (
      SELECT 1 FROM blocks bk
      WHERE bk.blocker_id = $1 AND bk.blocked_id = other.id
    ) AS blocked_by_me,
    (
      SELECT COUNT(*)::int
      FROM messages um
      WHERE um.conversation_id = c.id
        AND um.sender_id <> $1
        AND um.read_at IS NULL
        AND um.created_at > COALESCE(
          CASE WHEN c.user_a = $1 THEN c.a_last_read_at ELSE c.b_last_read_at END,
          '-infinity'::timestamptz
        )
    ) AS unread_count
  FROM conversations c
  JOIN users other ON other.id = CASE WHEN c.user_a = $1 THEN c.user_b ELSE c.user_a END
  LEFT JOIN LATERAL (
    SELECT m.id, m.body, m.created_at, m.sender_id
    FROM messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC, m.id DESC
    LIMIT 1
  ) lm ON true
`;

async function hasBlockBetween(db, userOne, userTwo) {
  const { rows } = await db.query(
    `SELECT 1 FROM blocks
     WHERE (blocker_id = $1 AND blocked_id = $2)
        OR (blocker_id = $2 AND blocked_id = $1)
     LIMIT 1`,
    [userOne, userTwo],
  );
  return rows.length > 0;
}

async function getParticipantConversation(db, conversationId, meId) {
  const { rows } = await db.query(
    `SELECT id, user_a, user_b, initiated_by, status, ended_by, a_deleted_at, b_deleted_at
     FROM conversations
     WHERE id = $1
       AND (
         (user_a = $2 AND a_deleted_at IS NULL)
         OR (user_b = $2 AND b_deleted_at IS NULL)
       )`,
    [conversationId, meId],
  );
  if (rows.length === 0) {
    throw AppError.notFound('Conversation not found');
  }
  const row = rows[0];
  return {
    ...row,
    otherId: row.user_a === meId ? row.user_b : row.user_a,
    isUserA: row.user_a === meId,
  };
}

async function fetchConversationById(db, meId, conversationId) {
  const { rows } = await db.query(
    `${CONVERSATION_SELECT}
     WHERE c.id = $2
       AND (
         (c.user_a = $1 AND c.a_deleted_at IS NULL)
         OR (c.user_b = $1 AND c.b_deleted_at IS NULL)
       )`,
    [meId, conversationId],
  );
  if (rows.length === 0) {
    throw AppError.notFound('Conversation not found');
  }
  return toConversation(rows[0], meId);
}

/**
 * Idempotently returns an existing active conversation or creates/reactivates one.
 */
async function createOrGetConversation(meId, targetMemberId) {
  if (meId === targetMemberId) {
    throw AppError.badRequest('Cannot start a conversation with yourself');
  }

  const targetRes = await pool.query(
    `SELECT id FROM users
     WHERE id = $1 AND status = 'active' AND email_verified_at IS NOT NULL AND role <> 'admin'`,
    [targetMemberId],
  );
  if (targetRes.rows.length === 0) {
    throw AppError.notFound('Member not found');
  }

  if (await hasBlockBetween(pool, meId, targetMemberId)) {
    throw AppError.forbidden('USER_BLOCKED', 'Unable to message this user');
  }

  const [userA, userB] = canonicalPair(meId, targetMemberId);
  const existingRes = await pool.query(
    `SELECT id, status, a_deleted_at, b_deleted_at
     FROM conversations
     WHERE user_a = $1 AND user_b = $2`,
    [userA, userB],
  );

  const existing = existingRes.rows[0];
  if (existing && existing.status === 'active') {
    const isUserA = userA === meId;
    if ((isUserA && existing.a_deleted_at) || (!isUserA && existing.b_deleted_at)) {
      const col = isUserA ? 'a_deleted_at' : 'b_deleted_at';
      await pool.query(`UPDATE conversations SET ${col} = NULL WHERE id = $1`, [existing.id]);
    }
    const conversation = await fetchConversationById(pool, meId, existing.id);
    return { created: false, conversation };
  }

  antiSpam.checkNewConversationRateLimit(meId);

  let convoId;
  await withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO conversations (user_a, user_b, initiated_by, status)
       VALUES ($1, $2, $3, 'active')
       ON CONFLICT (user_a, user_b) DO UPDATE
         SET status = 'active',
             ended_by = NULL,
             initiated_by = EXCLUDED.initiated_by,
             a_deleted_at = NULL,
             b_deleted_at = NULL
       RETURNING id`,
      [userA, userB, meId],
    );
    convoId = rows[0].id;
  });

  antiSpam.recordConversationCreated(meId);
  const conversation = await fetchConversationById(pool, meId, convoId);
  return { created: true, conversation };
}

async function listConversations(meId, { limit = 20, cursor }) {
  const decodedCursor = decodeCursor(cursor, isValidTimeIdCursor);
  const params = [meId];
  const conditions = [
    `((c.user_a = $1 AND c.a_deleted_at IS NULL) OR (c.user_b = $1 AND c.b_deleted_at IS NULL))`,
  ];

  if (decodedCursor) {
    params.push(decodedCursor.ts, decodedCursor.id);
    conditions.push(
      `(COALESCE(c.last_message_at, c.created_at), c.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`,
    );
  }

  params.push(limit + 1);
  const { rows } = await pool.query(
    `${CONVERSATION_SELECT}
     WHERE ${conditions.join(' AND ')}
     ORDER BY COALESCE(c.last_message_at, c.created_at) DESC, c.id DESC
     LIMIT $${params.length}`,
    params,
  );

  const page = slicePage(rows, limit, (lastRow) => ({
    ts: new Date(lastRow.last_message_at || lastRow.created_at).toISOString(),
    id: lastRow.id,
  }));

  return {
    items: page.rows.map((row) => toConversation(row, meId)),
    nextCursor: page.nextCursor,
  };
}

async function listMessages(meId, conversationId, { limit = 20, before }) {
  await getParticipantConversation(pool, conversationId, meId);

  const decodedCursor = decodeCursor(before, isValidTimeIdCursor);
  const params = [conversationId];
  const conditions = ['m.conversation_id = $1'];

  if (decodedCursor) {
    params.push(decodedCursor.ts, decodedCursor.id);
    conditions.push(
      `(m.created_at, m.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`,
    );
  }

  params.push(limit + 1);
  const { rows } = await pool.query(
    `SELECT m.id, m.conversation_id, m.sender_id, m.body, m.client_msg_id, m.read_at, m.created_at
     FROM messages m
     WHERE ${conditions.join(' AND ')}
     ORDER BY m.created_at DESC, m.id DESC
     LIMIT $${params.length}`,
    params,
  );

  const page = slicePage(rows, limit, (lastRow) => ({
    ts: new Date(lastRow.created_at).toISOString(),
    id: lastRow.id,
  }));

  return {
    items: page.rows.map((row) => toMessage(row, meId)),
    nextCursor: page.nextCursor,
  };
}

async function sendMessage(meId, conversationId, { body, clientMsgId }) {
  const convo = await getParticipantConversation(pool, conversationId, meId);

  if (convo.status === 'ended') {
    throw AppError.conflict('CONVERSATION_ENDED', 'This conversation has ended');
  }

  if (await hasBlockBetween(pool, meId, convo.otherId)) {
    throw AppError.forbidden('USER_BLOCKED', 'Unable to send message to this user');
  }

  // Idempotent retry check before anti-spam counters
  if (clientMsgId) {
    const existingRes = await pool.query(
      `SELECT id, conversation_id, sender_id, body, client_msg_id, read_at, created_at
       FROM messages
       WHERE conversation_id = $1 AND sender_id = $2 AND client_msg_id = $3`,
      [conversationId, meId, clientMsgId],
    );
    if (existingRes.rows.length > 0) {
      return toMessage(existingRes.rows[0], meId);
    }
  }

  antiSpam.checkMessageRateLimit(meId);

  if (env.STRICT_FIRST_CONTACT && convo.initiated_by === meId) {
    const { rows: countRows } = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE sender_id = $2)::int AS mine_count,
         COUNT(*) FILTER (WHERE sender_id = $3)::int AS other_count
       FROM messages
       WHERE conversation_id = $1`,
      [conversationId, meId, convo.otherId],
    );
    const counts = countRows[0] || { mine_count: 0, other_count: 0 };
    if (counts.other_count === 0 && counts.mine_count >= 1) {
      throw AppError.rateLimited(
        'RATE_LIMITED',
        'Please wait for a reply before sending another message',
        { retryAfter: 30 },
      );
    }
  }

  await antiSpam.checkDuplicateMessage({
    userId: meId,
    conversationId,
    body,
    db: pool,
  });

  let savedRow = null;
  let wasIdempotentRace = false;

  try {
    await withTransaction(async (client) => {
      const insertRes = await client.query(
        `INSERT INTO messages (conversation_id, sender_id, body, client_msg_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, conversation_id, sender_id, body, client_msg_id, read_at, created_at`,
        [conversationId, meId, body, clientMsgId || null],
      );
      savedRow = insertRes.rows[0];

      const otherDeletedCol = convo.isUserA ? 'b_deleted_at' : 'a_deleted_at';
      await client.query(
        `UPDATE conversations
         SET last_message_at = $2,
             ${otherDeletedCol} = NULL
         WHERE id = $1`,
        [conversationId, savedRow.created_at],
      );
    });
  } catch (err) {
    if (err?.code === '23505' && clientMsgId) {
      const raceRes = await pool.query(
        `SELECT id, conversation_id, sender_id, body, client_msg_id, read_at, created_at
         FROM messages
         WHERE conversation_id = $1 AND sender_id = $2 AND client_msg_id = $3`,
        [conversationId, meId, clientMsgId],
      );
      if (raceRes.rows.length > 0) {
        savedRow = raceRes.rows[0];
        wasIdempotentRace = true;
      } else {
        throw err;
      }
    } else {
      throw err;
    }
  }

  if (!wasIdempotentRace) {
    antiSpam.recordMessageSent({ userId: meId, conversationId, body });

    if (getIo()) {
      const [senderConversation, recipientConversation] = await Promise.all([
        fetchConversationById(pool, meId, conversationId),
        fetchConversationById(pool, convo.otherId, conversationId),
      ]);
      emitMessageNew({
        senderId: meId,
        recipientId: convo.otherId,
        senderMessage: toMessage(savedRow, meId),
        recipientMessage: toMessage(savedRow, convo.otherId),
        senderConversation,
        recipientConversation,
      });
    }
  }

  return toMessage(savedRow, meId);
}

async function markConversationRead(meId, conversationId) {
  const convo = await getParticipantConversation(pool, conversationId, meId);
  const lastReadCol = convo.isUserA ? 'a_last_read_at' : 'b_last_read_at';
  const readAt = new Date().toISOString();

  await withTransaction(async (client) => {
    await client.query(`UPDATE conversations SET ${lastReadCol} = $2 WHERE id = $1`, [
      conversationId,
      readAt,
    ]);
    await client.query(
      `UPDATE messages
       SET read_at = $3
       WHERE conversation_id = $1 AND sender_id <> $2 AND read_at IS NULL`,
      [conversationId, meId, readAt],
    );
  });

  emitMessageRead({ conversationId, otherId: convo.otherId, readAt });
  return { readAt, otherId: convo.otherId };
}

async function endConversation(meId, conversationId) {
  const convo = await getParticipantConversation(pool, conversationId, meId);
  await pool.query(
    `UPDATE conversations
     SET status = 'ended', ended_by = COALESCE(ended_by, $2)
     WHERE id = $1 AND status = 'active'`,
    [conversationId, meId],
  );
  emitConversationEnded({
    conversationId,
    userA: convo.user_a,
    userB: convo.user_b,
  });
  return { otherId: convo.otherId };
}

async function deleteConversation(meId, conversationId) {
  const convo = await getParticipantConversation(pool, conversationId, meId);
  const deletedCol = convo.isUserA ? 'a_deleted_at' : 'b_deleted_at';

  await withTransaction(async (client) => {
    const { rows } = await client.query(
      `UPDATE conversations
       SET ${deletedCol} = COALESCE(${deletedCol}, now())
       WHERE id = $1
       RETURNING a_deleted_at, b_deleted_at`,
      [conversationId],
    );

    if (rows[0]?.a_deleted_at && rows[0]?.b_deleted_at) {
      await client.query('DELETE FROM messages WHERE conversation_id = $1', [conversationId]);
    }
  });
}

async function getUnreadCount(meId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM messages m
     JOIN conversations c ON c.id = m.conversation_id
     WHERE (
       (c.user_a = $1 AND c.a_deleted_at IS NULL)
       OR (c.user_b = $1 AND c.b_deleted_at IS NULL)
     )
       AND m.sender_id <> $1
       AND m.read_at IS NULL
       AND m.created_at > COALESCE(
         CASE WHEN c.user_a = $1 THEN c.a_last_read_at ELSE c.b_last_read_at END,
         '-infinity'::timestamptz
       )`,
    [meId],
  );
  return { total: Number(rows[0]?.total || 0) };
}

module.exports = {
  createOrGetConversation,
  listConversations,
  listMessages,
  sendMessage,
  markConversationRead,
  endConversation,
  deleteConversation,
  getUnreadCount,
};

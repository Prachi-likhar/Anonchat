const { pool } = require('../db/pool');
const presenceService = require('../services/presenceService');
const logger = require('../utils/logger');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TYPING_THROTTLE_MS = 1500;
const lastTypingSentAt = new Map();

async function getPresencePeerIds(userId) {
  try {
    const { rows } = await pool.query(
      `SELECT CASE WHEN c.user_a = $1 THEN c.user_b ELSE c.user_a END AS peer_id
       FROM conversations c
       WHERE ((c.user_a = $1 AND c.a_deleted_at IS NULL)
           OR (c.user_b = $1 AND c.b_deleted_at IS NULL))
         AND NOT EXISTS (
           SELECT 1 FROM blocks b
           WHERE (b.blocker_id = $1 AND b.blocked_id = CASE WHEN c.user_a = $1 THEN c.user_b ELSE c.user_a END)
              OR (b.blocker_id = CASE WHEN c.user_a = $1 THEN c.user_b ELSE c.user_a END AND b.blocked_id = $1)
         )`,
      [userId],
    );
    return rows.map((r) => r.peer_id);
  } catch (err) {
    logger.error({ err }, 'Failed to load presence peers');
    return [];
  }
}

async function broadcastPresence(io, userId, isOnline) {
  const peerIds = await getPresencePeerIds(userId);
  for (const peerId of peerIds) {
    io.to(`user:${peerId}`).emit('presence', { memberId: userId, isOnline });
  }
}

async function getActiveTypingRecipient(userId, conversationId) {
  const { rows } = await pool.query(
    `SELECT c.user_a, c.user_b
     FROM conversations c
     WHERE c.id = $1
       AND c.status = 'active'
       AND (
         (c.user_a = $2 AND c.a_deleted_at IS NULL)
         OR (c.user_b = $2 AND c.b_deleted_at IS NULL)
       )
       AND NOT EXISTS (
         SELECT 1 FROM blocks b
         WHERE (b.blocker_id = c.user_a AND b.blocked_id = c.user_b)
            OR (b.blocker_id = c.user_b AND b.blocked_id = c.user_a)
       )`,
    [conversationId, userId],
  );
  if (rows.length === 0) return null;
  const row = rows[0];
  return row.user_a === userId ? row.user_b : row.user_a;
}

function scheduleJwtExpiryDisconnect(socket, tokenExp) {
  if (!tokenExp) return null;
  const delayMs = tokenExp * 1000 - Date.now();
  if (delayMs <= 0) {
    socket.disconnect(true);
    return null;
  }
  const timer = setTimeout(
    () => {
      socket.disconnect(true);
    },
    Math.min(delayMs, 2147483647),
  );
  if (typeof timer.unref === 'function') {
    timer.unref();
  }
  return timer;
}

async function handleConnection(io, socket) {
  const { userId, tokenExp } = socket.data;
  socket.join(`user:${userId}`);

  const expiryTimer = scheduleJwtExpiryDisconnect(socket, tokenExp);

  async function handleTyping(payload, isTyping) {
    const conversationId = payload?.conversationId;
    if (typeof conversationId !== 'string' || !UUID_REGEX.test(conversationId)) {
      return;
    }

    const throttleKey = `${userId}:${conversationId}`;
    if (isTyping) {
      const now = Date.now();
      const prev = lastTypingSentAt.get(throttleKey) || 0;
      if (now - prev < TYPING_THROTTLE_MS) {
        return;
      }
      lastTypingSentAt.set(throttleKey, now);
    } else {
      lastTypingSentAt.delete(throttleKey);
    }

    try {
      const recipientId = await getActiveTypingRecipient(userId, conversationId);
      if (!recipientId) return;
      io.to(`user:${recipientId}`).emit('typing', { conversationId, isTyping });
    } catch (err) {
      logger.error({ err }, 'Error handling typing event');
    }
  }

  // Register listeners synchronously before any await so early events/disconnects are never missed
  socket.on('typing:start', (payload) => handleTyping(payload, true));
  socket.on('typing:stop', (payload) => handleTyping(payload, false));

  socket.on('disconnect', async () => {
    if (expiryTimer) {
      clearTimeout(expiryTimer);
    }
    const { becameOffline } = presenceService.removeConnection(userId);
    if (becameOffline) {
      try {
        await pool.query('UPDATE users SET last_seen_at = now() WHERE id = $1', [userId]);
      } catch (err) {
        logger.error({ err }, 'Failed to update last_seen_at on disconnect');
      }
      await broadcastPresence(io, userId, false);
    }
  });

  const { becameOnline } = presenceService.addConnection(userId);
  if (becameOnline) {
    await broadcastPresence(io, userId, true);
  }
}

function clearTypingThrottle() {
  lastTypingSentAt.clear();
}

module.exports = {
  handleConnection,
  getPresencePeerIds,
  clearTypingThrottle,
};

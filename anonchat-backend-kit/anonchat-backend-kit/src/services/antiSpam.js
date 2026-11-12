const crypto = require('crypto');
const AppError = require('../utils/AppError');

const BURST_WINDOW_MS = 10 * 1000;
const BURST_LIMIT = 5;

const MINUTE_WINDOW_MS = 60 * 1000;
const MINUTE_LIMIT = 20;

const DUPLICATE_WINDOW_MS = 60 * 1000;
const DUPLICATE_THRESHOLD = 3; // 3rd identical message within 60s triggers DUPLICATE_MESSAGE

const NEW_CONVO_WINDOW_MS = 60 * 60 * 1000;
const NEW_CONVO_LIMIT = 10;

// In-memory v1 stores (kept behind service functions so Redis can replace them later)
const messageTimestamps = new Map(); // userId -> number[]
const recentBodies = new Map(); // `${userId}:${conversationId}` -> Array<{ hash: string, ts: number }>
const newConvoTimestamps = new Map(); // userId -> number[]

function pruneTimestamps(map, key, maxWindowMs, now) {
  const list = map.get(key) || [];
  const cutoff = now - maxWindowMs;
  const pruned = list.filter((ts) => ts > cutoff);
  if (pruned.length === 0) {
    map.delete(key);
  } else {
    map.set(key, pruned);
  }
  return pruned;
}

function calcRetryAfterSec(oldestTs, windowMs, now) {
  if (!oldestTs) return 1;
  return Math.max(1, Math.ceil((oldestTs + windowMs - now) / 1000));
}

function normalizeBodyHash(body) {
  const normalized = String(body).trim().toLowerCase().replace(/\s+/g, ' ');
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Enforces per-user sliding-window message limits: 5/10s burst and 20/min.
 */
function checkMessageRateLimit(userId, now = Date.now()) {
  const recent = pruneTimestamps(messageTimestamps, userId, MINUTE_WINDOW_MS, now);

  const burstCutoff = now - BURST_WINDOW_MS;
  const burst = recent.filter((ts) => ts > burstCutoff);
  if (burst.length >= BURST_LIMIT) {
    throw AppError.rateLimited('RATE_LIMITED', 'You are sending messages too quickly', {
      retryAfter: calcRetryAfterSec(burst[0], BURST_WINDOW_MS, now),
    });
  }

  if (recent.length >= MINUTE_LIMIT) {
    throw AppError.rateLimited('RATE_LIMITED', 'Message rate limit exceeded (20/min)', {
      retryAfter: calcRetryAfterSec(recent[0], MINUTE_WINDOW_MS, now),
    });
  }
}

/**
 * Enforces 10 new conversations per hour per user.
 */
function checkNewConversationRateLimit(userId, now = Date.now()) {
  const recent = pruneTimestamps(newConvoTimestamps, userId, NEW_CONVO_WINDOW_MS, now);
  if (recent.length >= NEW_CONVO_LIMIT) {
    throw AppError.rateLimited('RATE_LIMITED', 'New conversation rate limit exceeded (10/hour)', {
      retryAfter: calcRetryAfterSec(recent[0], NEW_CONVO_WINDOW_MS, now),
    });
  }
}

/**
 * Checks whether >= 3 identical normalized message bodies have been sent to the same
 * conversation within 60s (in-memory sliding window + DB backstop).
 */
async function checkDuplicateMessage({ userId, conversationId, body, db, now = Date.now() }) {
  const targetHash = normalizeBodyHash(body);
  const key = `${userId}:${conversationId}`;
  const cutoff = now - DUPLICATE_WINDOW_MS;

  const memEntries = (recentBodies.get(key) || []).filter((e) => e.ts > cutoff);
  if (memEntries.length === 0) {
    recentBodies.delete(key);
  } else {
    recentBodies.set(key, memEntries);
  }

  const memMatches = memEntries.filter((e) => e.hash === targetHash);
  let priorCount = memMatches.length;
  let oldestMatchTs = memMatches[0]?.ts || null;

  if (db) {
    const sinceIso = new Date(cutoff).toISOString();
    const { rows } = await db.query(
      `SELECT body, created_at
       FROM messages
       WHERE conversation_id = $1 AND sender_id = $2 AND created_at > $3
       ORDER BY created_at ASC`,
      [conversationId, userId, sinceIso],
    );
    const dbMatches = rows.filter((r) => normalizeBodyHash(r.body) === targetHash);
    if (dbMatches.length > priorCount) {
      priorCount = dbMatches.length;
      oldestMatchTs = new Date(dbMatches[0].created_at).getTime();
    }
  }

  if (priorCount >= DUPLICATE_THRESHOLD - 1) {
    throw AppError.rateLimited(
      'DUPLICATE_MESSAGE',
      'Duplicate message sent too many times in a short period',
      {
        retryAfter: calcRetryAfterSec(oldestMatchTs || now, DUPLICATE_WINDOW_MS, now),
      },
    );
  }
}

function recordMessageSent({ userId, conversationId, body, now = Date.now() }) {
  const list = pruneTimestamps(messageTimestamps, userId, MINUTE_WINDOW_MS, now);
  list.push(now);
  messageTimestamps.set(userId, list);

  const key = `${userId}:${conversationId}`;
  const cutoff = now - DUPLICATE_WINDOW_MS;
  const entries = (recentBodies.get(key) || []).filter((e) => e.ts > cutoff);
  entries.push({ hash: normalizeBodyHash(body), ts: now });
  recentBodies.set(key, entries);
}

function recordConversationCreated(userId, now = Date.now()) {
  const list = pruneTimestamps(newConvoTimestamps, userId, NEW_CONVO_WINDOW_MS, now);
  list.push(now);
  newConvoTimestamps.set(userId, list);
}

function clearAntiSpam() {
  messageTimestamps.clear();
  recentBodies.clear();
  newConvoTimestamps.clear();
}

module.exports = {
  normalizeBodyHash,
  checkMessageRateLimit,
  checkNewConversationRateLimit,
  checkDuplicateMessage,
  recordMessageSent,
  recordConversationCreated,
  clearAntiSpam,
};


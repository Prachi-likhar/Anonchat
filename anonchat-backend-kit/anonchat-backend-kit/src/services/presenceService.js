/**
 * In-memory multi-device presence store for v1.
 * Maps userId -> active socket connection count.
 */
const connections = new Map();

/**
 * Increments active connection count for a user.
 * @param {string} userId
 * @returns {{ becameOnline: boolean, count: number }}
 */
function addConnection(userId) {
  const prev = connections.get(userId) || 0;
  const next = prev + 1;
  connections.set(userId, next);
  return { becameOnline: prev === 0, count: next };
}

/**
 * Decrements active connection count for a user.
 * @param {string} userId
 * @returns {{ becameOffline: boolean, count: number }}
 */
function removeConnection(userId) {
  const prev = connections.get(userId) || 0;
  if (prev <= 1) {
    connections.delete(userId);
    return { becameOffline: prev > 0, count: 0 };
  }
  const next = prev - 1;
  connections.set(userId, next);
  return { becameOffline: false, count: next };
}

/**
 * @param {string} userId
 * @returns {boolean}
 */
function isOnline(userId) {
  return (connections.get(userId) || 0) > 0;
}

/**
 * @returns {string[]}
 */
function getOnlineUserIds() {
  return Array.from(connections.keys());
}

/**
 * @returns {number}
 */
function getOnlineCount() {
  return connections.size;
}

function clearPresence() {
  connections.clear();
}

module.exports = {
  addConnection,
  removeConnection,
  isOnline,
  getOnlineUserIds,
  getOnlineCount,
  clearPresence,
};


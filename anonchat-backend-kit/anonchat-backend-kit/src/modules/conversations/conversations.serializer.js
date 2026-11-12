const { toPublicMember } = require('../users/users.serializer');
const presenceService = require('../../services/presenceService');

/**
 * Returns canonical [userA, userB] ordering matching PostgreSQL uuid `<` ordering.
 * @param {string} id1
 * @param {string} id2
 * @returns {[string, string]}
 */
function canonicalPair(id1, id2) {
  return id1 < id2 ? [id1, id2] : [id2, id1];
}

/**
 * Serializes a message row into the API contract `Message` shape.
 */
function toMessage(row, meId) {
  const msg = {
    id: row.id,
    conversationId: row.conversation_id,
    mine: row.sender_id === meId,
    body: row.body,
    createdAt: new Date(row.created_at).toISOString(),
    readAt: row.read_at ? new Date(row.read_at).toISOString() : null,
  };
  if (row.client_msg_id) {
    msg.clientMsgId = row.client_msg_id;
  }
  return msg;
}

/**
 * Serializes a joined conversation row into the API contract `Conversation` shape.
 */
function toConversation(row, meId) {
  const otherRow = {
    id: row.other_id,
    anon_username: row.other_anon_username,
    gender: row.other_gender,
    avatar_color: row.other_avatar_color,
  };

  return {
    id: row.id,
    other: toPublicMember(otherRow, {
      isOnline: presenceService.isOnline(row.other_id),
      blockedByMe: Boolean(row.blocked_by_me),
    }),
    lastMessage: row.last_msg_id
      ? {
          id: row.last_msg_id,
          body: row.last_msg_body,
          createdAt: new Date(row.last_msg_created_at).toISOString(),
          mine: row.last_msg_sender_id === meId,
        }
      : null,
    unreadCount: Number(row.unread_count || 0),
    status: row.status,
    endedByMe: row.ended_by === meId,
    updatedAt: new Date(row.last_message_at || row.created_at).toISOString(),
  };
}

module.exports = {
  canonicalPair,
  toMessage,
  toConversation,
};

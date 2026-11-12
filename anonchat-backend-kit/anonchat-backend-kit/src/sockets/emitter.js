let ioInstance = null;

function setIo(io) {
  ioInstance = io;
}

function getIo() {
  return ioInstance;
}

function emitMessageNew({
  senderId,
  recipientId,
  senderMessage,
  recipientMessage,
  senderConversation,
  recipientConversation,
}) {
  if (!ioInstance) return;
  ioInstance.to(`user:${recipientId}`).emit('message:new', {
    message: recipientMessage,
    conversation: recipientConversation,
  });
  ioInstance.to(`user:${senderId}`).emit('message:new', {
    message: senderMessage,
    conversation: senderConversation,
  });
}

function emitMessageRead({ conversationId, otherId, readAt }) {
  if (!ioInstance) return;
  ioInstance.to(`user:${otherId}`).emit('message:read', {
    conversationId,
    readAt,
  });
}

function emitConversationEnded({ conversationId, userA, userB }) {
  if (!ioInstance) return;
  ioInstance.to(`user:${userA}`).to(`user:${userB}`).emit('conversation:ended', {
    conversationId,
  });
}

function emitForceLogout({ userId, reason }) {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit('force-logout', { reason });
  ioInstance.in(`user:${userId}`).disconnectSockets(true);
}

module.exports = {
  setIo,
  getIo,
  emitMessageNew,
  emitMessageRead,
  emitConversationEnded,
  emitForceLogout,
};

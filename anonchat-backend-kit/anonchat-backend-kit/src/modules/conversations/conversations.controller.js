const conversationsService = require('./conversations.service');

async function createConversation(req, res) {
  const { created, conversation } = await conversationsService.createOrGetConversation(
    req.user.id,
    req.validated.body.memberId,
  );
  res.status(created ? 201 : 200).json(conversation);
}

async function listConversations(req, res) {
  const result = await conversationsService.listConversations(req.user.id, req.validated.query);
  res.status(200).json(result);
}

async function listMessages(req, res) {
  const result = await conversationsService.listMessages(
    req.user.id,
    req.validated.params.id,
    req.validated.query,
  );
  res.status(200).json(result);
}

async function sendMessage(req, res) {
  const message = await conversationsService.sendMessage(
    req.user.id,
    req.validated.params.id,
    req.validated.body,
  );
  res.status(201).json(message);
}

async function markRead(req, res) {
  await conversationsService.markConversationRead(req.user.id, req.validated.params.id);
  res.status(204).send();
}

async function endConversation(req, res) {
  await conversationsService.endConversation(req.user.id, req.validated.params.id);
  res.status(204).send();
}

async function deleteConversation(req, res) {
  await conversationsService.deleteConversation(req.user.id, req.validated.params.id);
  res.status(204).send();
}

async function getUnreadCount(req, res) {
  const result = await conversationsService.getUnreadCount(req.user.id);
  res.status(200).json(result);
}

module.exports = {
  createConversation,
  listConversations,
  listMessages,
  sendMessage,
  markRead,
  endConversation,
  deleteConversation,
  getUnreadCount,
};

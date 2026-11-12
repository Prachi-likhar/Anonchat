const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const conversationsController = require('./conversations.controller');
const {
  createConversationSchema,
  listConversationsSchema,
  listMessagesSchema,
  sendMessageSchema,
  conversationIdSchema,
} = require('./conversations.schemas');

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  validate(createConversationSchema),
  asyncHandler(conversationsController.createConversation),
);
router.get(
  '/',
  validate(listConversationsSchema),
  asyncHandler(conversationsController.listConversations),
);
router.get(
  '/:id/messages',
  validate(listMessagesSchema),
  asyncHandler(conversationsController.listMessages),
);
router.post(
  '/:id/messages',
  validate(sendMessageSchema),
  asyncHandler(conversationsController.sendMessage),
);
router.post(
  '/:id/read',
  validate(conversationIdSchema),
  asyncHandler(conversationsController.markRead),
);
router.post(
  '/:id/end',
  validate(conversationIdSchema),
  asyncHandler(conversationsController.endConversation),
);
router.delete(
  '/:id',
  validate(conversationIdSchema),
  asyncHandler(conversationsController.deleteConversation),
);

module.exports = router;


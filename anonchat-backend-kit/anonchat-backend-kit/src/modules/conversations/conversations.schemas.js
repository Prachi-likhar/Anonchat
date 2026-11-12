const { z } = require('zod');

const uuidParam = z.object({
  id: z.string().uuid('Valid conversation id UUID is required'),
});

const createConversationSchema = {
  body: z.object({
    memberId: z.string().uuid('Valid memberId UUID is required'),
  }),
};

const listConversationsSchema = {
  query: z.object({
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
    cursor: z.string().min(1).optional(),
  }),
};

const listMessagesSchema = {
  params: uuidParam,
  query: z.object({
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
    before: z.string().min(1).optional(),
  }),
};

const sendMessageSchema = {
  params: uuidParam,
  body: z.object({
    body: z
      .string()
      .trim()
      .min(1, 'Message body cannot be empty')
      .max(2000, 'Message body must be at most 2000 characters'),
    clientMsgId: z.string().trim().min(1).max(128).optional(),
  }),
};

const conversationIdSchema = {
  params: uuidParam,
};

module.exports = {
  createConversationSchema,
  listConversationsSchema,
  listMessagesSchema,
  sendMessageSchema,
  conversationIdSchema,
};

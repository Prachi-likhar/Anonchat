const { z } = require('zod');

const createReportSchema = {
  body: z.object({
    memberId: z.string().uuid('Valid memberId UUID is required'),
    conversationId: z.string().uuid('Valid conversationId UUID is required').optional(),
    reason: z.enum(['spam', 'harassment', 'inappropriate', 'impersonation', 'other']),
    details: z.string().trim().max(500, 'Details must be at most 500 characters').optional(),
  }),
};

module.exports = {
  createReportSchema,
};

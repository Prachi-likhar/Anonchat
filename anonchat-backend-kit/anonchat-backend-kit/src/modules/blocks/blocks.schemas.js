const { z } = require('zod');

const blockMemberSchema = {
  body: z.object({
    memberId: z.string().uuid('Valid memberId UUID is required'),
  }),
};

const unblockMemberSchema = {
  params: z.object({
    memberId: z.string().uuid('Valid memberId UUID is required'),
  }),
};

module.exports = {
  blockMemberSchema,
  unblockMemberSchema,
};


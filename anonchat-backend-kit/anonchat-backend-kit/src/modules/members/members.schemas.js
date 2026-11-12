const { z } = require('zod');

const listMembersSchema = {
  query: z.object({
    filter: z.enum(['all', 'male', 'female', 'online']).optional().default('all'),
    search: z.string().trim().max(50).optional().default(''),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
    cursor: z.string().min(1).optional(),
  }),
};

module.exports = {
  listMembersSchema,
};


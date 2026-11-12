const { z } = require('zod');

const uuidParam = z.object({
  id: z.string().uuid('Valid UUID id is required'),
});

const listUsersSchema = {
  query: z.object({
    status: z.enum(['active', 'suspended', 'banned']).optional(),
    gender: z.enum(['male', 'female']).optional(),
    q: z.string().trim().max(100).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
    cursor: z.string().min(1).optional(),
  }),
};

const userIdSchema = {
  params: uuidParam,
};

const suspendUserSchema = {
  params: uuidParam,
  body: z.object({
    until: z
      .string()
      .datetime({ message: 'until must be a valid ISO-8601 UTC timestamp' })
      .refine((val) => new Date(val).getTime() > Date.now(), {
        message: 'until must be in the future',
      }),
    reason: z.string().trim().min(1, 'Reason is required').max(500),
  }),
};

const banUserSchema = {
  params: uuidParam,
  body: z.object({
    reason: z.string().trim().min(1, 'Reason is required').max(500),
  }),
};

const changeRoleSchema = {
  params: uuidParam,
  body: z.object({
    role: z.enum(['user', 'admin']),
  }),
};

const listReportsSchema = {
  query: z.object({
    status: z.enum(['open', 'reviewing', 'resolved', 'dismissed']).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
    cursor: z.string().min(1).optional(),
  }),
};

const reportIdSchema = {
  params: uuidParam,
};

const updateReportSchema = {
  params: uuidParam,
  body: z
    .object({
      status: z.enum(['reviewing', 'resolved', 'dismissed']),
      resolutionNote: z.string().trim().max(500).optional(),
      action: z.enum(['none', 'suspend', 'ban']).optional().default('none'),
      until: z.string().datetime().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.action !== 'none' && data.status !== 'resolved') {
        ctx.addIssue({
          code: 'custom',
          path: ['action'],
          message: 'Moderation actions can only be applied when resolving a report',
        });
      }
      if (data.action === 'suspend') {
        if (!data.until || new Date(data.until).getTime() <= Date.now()) {
          ctx.addIssue({
            code: 'custom',
            path: ['until'],
            message: 'A future ISO-8601 "until" timestamp is required to suspend',
          });
        }
      }
    }),
};

const listActivitySchema = {
  query: z.object({
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
    cursor: z.string().min(1).optional(),
  }),
};

module.exports = {
  listUsersSchema,
  userIdSchema,
  suspendUserSchema,
  banUserSchema,
  changeRoleSchema,
  listReportsSchema,
  reportIdSchema,
  updateReportSchema,
  listActivitySchema,
};

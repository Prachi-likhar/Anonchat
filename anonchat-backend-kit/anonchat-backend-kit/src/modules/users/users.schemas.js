const { z } = require('zod');
const { passwordSchema } = require('../auth/auth.schemas');

const updateMeSchema = {
  body: z.object({
    fullName: z.string().trim().min(2, 'Full name must be 2-60 characters').max(60).optional(),
    gender: z.enum(['male', 'female']).optional(),
    avatarColor: z
      .string()
      .trim()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Avatar color must be a #RRGGBB hex code')
      .optional(),
    theme: z.enum(['system', 'light', 'dark']).optional(),
  }),
};

const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required').max(128),
    newPassword: passwordSchema,
  }),
};

const deleteMeSchema = {
  body: z.object({
    password: z.string().min(1, 'Password is required').max(128),
  }),
};

module.exports = {
  updateMeSchema,
  changePasswordSchema,
  deleteMeSchema,
};


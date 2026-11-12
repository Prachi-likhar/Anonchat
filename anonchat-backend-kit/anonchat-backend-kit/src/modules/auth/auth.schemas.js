const { z } = require('zod');

const emailSchema = z.string().trim().toLowerCase().email('Valid email is required');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .refine((val) => /[a-zA-Z]/.test(val) && /\d/.test(val), {
    message: 'Password must contain at least 1 letter and 1 number',
  });

const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'OTP must be a 6-digit code');

const registerSchema = {
  body: z.object({
    fullName: z.string().trim().min(2, 'Full name must be 2-60 characters').max(60),
    email: emailSchema,
    password: passwordSchema,
    gender: z.enum(['male', 'female']),
  }),
};

const verifyEmailSchema = {
  body: z.object({
    email: emailSchema,
    otp: otpSchema,
  }),
};

const emailOnlySchema = {
  body: z.object({
    email: emailSchema,
  }),
};

const loginSchema = {
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required').max(128),
  }),
};

const refreshSchema = {
  body: z
    .object({
      refreshToken: z.string().min(1).optional(),
    })
    .optional()
    .default({}),
};

const logoutSchema = {
  body: z
    .object({
      refreshToken: z.string().min(1).optional(),
    })
    .optional()
    .default({}),
};

const resetPasswordSchema = {
  body: z.object({
    email: emailSchema,
    otp: otpSchema,
    newPassword: passwordSchema,
  }),
};

module.exports = {
  emailSchema,
  passwordSchema,
  otpSchema,
  registerSchema,
  verifyEmailSchema,
  emailOnlySchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  resetPasswordSchema,
};


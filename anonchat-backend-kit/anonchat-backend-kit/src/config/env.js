const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config({ quiet: true });

const booleanString = (defaultValue) =>
  z
    .enum(['true', 'false'])
    .optional()
    .default(defaultValue ? 'true' : 'false')
    .transform((val) => val === 'true');

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    DATABASE_URL: z.string().trim().min(1, 'DATABASE_URL is required'),
    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    ACCESS_TTL: z.string().trim().min(1).default('15m'),
    REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),
    BCRYPT_COST: z.coerce.number().int().min(4).max(15).default(12),
    CORS_ORIGINS: z
      .string()
      .default('http://localhost:5173,http://localhost:8081')
      .transform((val) =>
        val
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean),
      )
      .refine((origins) => origins.length > 0, {
        message: 'CORS_ORIGINS must include at least one origin',
      }),
    COOKIE_SECURE: booleanString(false),
    APPS_SCRIPT_URL: z
      .string()
      .trim()
      .optional()
      .default('')
      .refine((val) => val === '' || /^https?:\/\/.+/.test(val), {
        message: 'APPS_SCRIPT_URL must be empty or a valid http(s) URL',
      }),
    APPS_SCRIPT_SECRET: z.string().trim().optional().default(''),
    OTP_TTL_MIN: z.coerce.number().int().positive().default(10),
    OTP_PEPPER: z.string().min(1, 'OTP_PEPPER is required'),
    SUPER_ADMIN_EMAIL: z.string().trim().email('SUPER_ADMIN_EMAIL must be a valid email'),
    SEED_ADMIN_PASSWORD: z.string().min(8, 'SEED_ADMIN_PASSWORD must be at least 8 characters'),
    ADMIN_CAN_SEE_FULL_NAME: booleanString(false),
    STRICT_FIRST_CONTACT: booleanString(false),
  })
  .superRefine((data, ctx) => {
    if (data.JWT_ACCESS_SECRET === data.JWT_REFRESH_SECRET) {
      ctx.addIssue({
        code: 'custom',
        path: ['JWT_REFRESH_SECRET'],
        message: 'JWT_REFRESH_SECRET must differ from JWT_ACCESS_SECRET',
      });
    }
    if (data.NODE_ENV === 'production') {
      if (!data.APPS_SCRIPT_URL) {
        ctx.addIssue({
          code: 'custom',
          path: ['APPS_SCRIPT_URL'],
          message: 'APPS_SCRIPT_URL is required in production',
        });
      }
      if (!data.APPS_SCRIPT_SECRET) {
        ctx.addIssue({
          code: 'custom',
          path: ['APPS_SCRIPT_SECRET'],
          message: 'APPS_SCRIPT_SECRET is required in production',
        });
      }
    }
  });

/**
 * Parses and validates environment variables. Throws a descriptive error (without secret values) on failure.
 * @param {NodeJS.ProcessEnv} rawEnv
 */
function parseEnv(rawEnv = process.env) {
  const result = envSchema.safeParse(rawEnv);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  return Object.freeze(result.data);
}

const env = parseEnv(process.env);

module.exports = { env, parseEnv };

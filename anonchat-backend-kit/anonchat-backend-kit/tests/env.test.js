const { parseEnv } = require('../src/config/env');

const baseEnv = {
  NODE_ENV: 'development',
  PORT: '4000',
  DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/anonchat',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
  ACCESS_TTL: '15m',
  REFRESH_TTL_DAYS: '30',
  BCRYPT_COST: '12',
  CORS_ORIGINS: 'http://localhost:5173, http://localhost:8081',
  COOKIE_SECURE: 'false',
  APPS_SCRIPT_URL: '',
  APPS_SCRIPT_SECRET: '',
  OTP_TTL_MIN: '10',
  OTP_PEPPER: 'pepper-value',
  SUPER_ADMIN_EMAIL: 'owner@example.com',
  SEED_ADMIN_PASSWORD: 'ChangeMe123',
  ADMIN_CAN_SEE_FULL_NAME: 'false',
  STRICT_FIRST_CONTACT: 'false',
};

describe('env configuration', () => {
  test('parses valid environment and transforms values', () => {
    const parsed = parseEnv(baseEnv);
    expect(parsed.PORT).toBe(4000);
    expect(parsed.BCRYPT_COST).toBe(12);
    expect(parsed.CORS_ORIGINS).toEqual(['http://localhost:5173', 'http://localhost:8081']);
    expect(parsed.COOKIE_SECURE).toBe(false);
    expect(parsed.ADMIN_CAN_SEE_FULL_NAME).toBe(false);
  });

  test('throws when required env var is missing', () => {
    const missingDb = { ...baseEnv, DATABASE_URL: '' };
    expect(() => parseEnv(missingDb)).toThrow(/DATABASE_URL/);
  });

  test('throws when JWT secrets are identical', () => {
    const sameSecrets = { ...baseEnv, JWT_REFRESH_SECRET: baseEnv.JWT_ACCESS_SECRET };
    expect(() => parseEnv(sameSecrets)).toThrow(/JWT_REFRESH_SECRET/);
  });

  test('requires Apps Script config in production', () => {
    const prodMissingScript = { ...baseEnv, NODE_ENV: 'production' };
    expect(() => parseEnv(prodMissingScript)).toThrow(/APPS_SCRIPT_URL/);
  });
});

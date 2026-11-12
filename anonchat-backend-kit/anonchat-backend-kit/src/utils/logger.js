const pino = require('pino');
const { env } = require('../config/env');

const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  '*.password',
  '*.currentPassword',
  '*.newPassword',
  '*.passwordHash',
  '*.password_hash',
  '*.otp',
  '*.code',
  '*.email',
  '*.fullName',
  '*.full_name',
  '*.body',
  '*.token',
  '*.accessToken',
  '*.refreshToken',
  'password',
  'currentPassword',
  'newPassword',
  'otp',
  'email',
  'fullName',
  'body',
  'token',
  'accessToken',
  'refreshToken',
];

const level = env.NODE_ENV === 'test' ? 'silent' : env.NODE_ENV === 'production' ? 'info' : 'debug';

const logger = pino({
  level,
  redact: {
    paths: REDACT_PATHS,
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

module.exports = logger;

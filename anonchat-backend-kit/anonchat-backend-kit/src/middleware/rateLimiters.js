const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { env } = require('../config/env');

/**
 * Factory for rate-limiter middlewares returning API contract 429 errors + Retry-After header.
 * @param {{ windowMs: number, limit: number, code?: string, message?: string, keyGenerator?: Function, skip?: Function }} opts
 */
function createRateLimiter({
  windowMs,
  limit,
  code = 'RATE_LIMITED',
  message = 'Too many requests, please try again later.',
  keyGenerator,
  skip,
}) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    ...(keyGenerator ? { keyGenerator } : {}),
    ...(skip ? { skip } : {}),
    handler: (req, res, _next, options) => {
      const resetTime = req.rateLimit?.resetTime;
      const retryAfterSec = resetTime
        ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
        : Math.max(1, Math.ceil(options.windowMs / 1000));

      res.set('Retry-After', String(retryAfterSec));
      res.status(429).json({
        error: {
          code,
          message,
        },
      });
    },
  });
}

function ipAndEmailKey(req) {
  const ip = ipKeyGenerator(req.ip || 'unknown');
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  return `${ip}:${email}`;
}

// Global rate limit: 300 req/min/IP
const globalLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  limit: env.NODE_ENV === 'test' ? 1000 : 300,
  message: 'Too many requests from this IP, please try again shortly.',
});

// Register: 5/hour/IP
const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: env.NODE_ENV === 'test' ? 1000 : 5,
  message: 'Too many registration attempts from this IP, please try again later.',
});

// Login: 10/15 min per IP+email
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: env.NODE_ENV === 'test' ? 1000 : 10,
  keyGenerator: ipAndEmailKey,
  message: 'Too many login attempts, please try again later.',
});

// OTP resend / forgot-password: 1/60s cooldown + 5/hour per IP+email
const otpCooldownLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  limit: env.NODE_ENV === 'test' ? 1000 : 1,
  keyGenerator: ipAndEmailKey,
  message: 'Please wait 60 seconds before requesting another verification code.',
});

const otpHourlyLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: env.NODE_ENV === 'test' ? 1000 : 5,
  keyGenerator: ipAndEmailKey,
  message: 'Too many verification code requests, please try again later.',
});

// Reports: 10/day per authenticated user
const reportsLimiter = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000,
  limit: env.NODE_ENV === 'test' ? 1000 : 10,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip || 'unknown'),
  message: 'Daily report limit reached. Please try again tomorrow.',
});

module.exports = {
  createRateLimiter,
  globalLimiter,
  registerLimiter,
  loginLimiter,
  otpCooldownLimiter,
  otpHourlyLimiter,
  reportsLimiter,
};

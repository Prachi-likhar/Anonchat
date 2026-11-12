const { rateLimit } = require('express-rate-limit');
const { env } = require('../config/env');

/**
 * Factory for rate-limiter middlewares returning API contract 429 errors + Retry-After header.
 * @param {{ windowMs: number, limit: number, code?: string, message?: string, keyGenerator?: Function }} opts
 */
function createRateLimiter({
  windowMs,
  limit,
  code = 'RATE_LIMITED',
  message = 'Too many requests, please try again later.',
  keyGenerator,
}) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    ...(keyGenerator ? { keyGenerator } : {}),
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

// Global rate limit: 300 req/min/IP (relaxed only if explicitly disabled, active by default)
const globalLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  limit: env.NODE_ENV === 'test' ? 1000 : 300,
  message: 'Too many requests from this IP, please try again shortly.',
});

module.exports = {
  createRateLimiter,
  globalLimiter,
};

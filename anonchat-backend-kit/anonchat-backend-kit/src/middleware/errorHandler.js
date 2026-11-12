const { ZodError } = require('zod');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * Centralised error handler returning the API contract error shape:
 * { error: { code, message, details? } }
 */
function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    const payload = {
      code: err.code,
      message: err.message,
    };
    if (err.details !== undefined) {
      payload.details = err.details;
    }
    if (err.statusCode === 429 && err.details && typeof err.details.retryAfter === 'number') {
      res.set('Retry-After', String(Math.ceil(err.details.retryAfter)));
    }
    return res.status(err.statusCode).json({ error: payload });
  }

  // Handle malformed JSON from express.json()
  if (
    (err instanceof SyntaxError && err.status === 400 && 'body' in err) ||
    err?.type === 'entity.parse.failed'
  ) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid JSON payload',
      },
    });
  }

  // Handle body exceeding 10kb limit
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request payload too large',
      },
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: {
          issues: err.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
      },
    });
  }

  logger.error(
    {
      err: {
        name: err?.name,
        message: err?.message,
        stack: err?.stack,
      },
      method: req.method,
      path: req.path,
    },
    'Unhandled application error',
  );

  return res.status(500).json({
    error: {
      code: 'INTERNAL',
      message: 'Internal server error',
    },
  });
}

module.exports = errorHandler;

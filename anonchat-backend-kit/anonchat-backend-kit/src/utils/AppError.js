/**
 * Operational application error mapped directly to the API contract error shape.
 */
class AppError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Machine-readable error code from API_CONTRACT.md
   * @param {string} message - Human-readable error message
   * @param {Record<string, unknown>} [details] - Optional structured details
   */
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Validation failed', details) {
    return new AppError(400, 'VALIDATION_ERROR', message, details);
  }

  static unauthenticated(message = 'Authentication required') {
    return new AppError(401, 'UNAUTHENTICATED', message);
  }

  static forbidden(code = 'FORBIDDEN', message = 'Forbidden', details) {
    return new AppError(403, code, message, details);
  }

  static notFound(message = 'Resource not found') {
    return new AppError(404, 'NOT_FOUND', message);
  }

  static conflict(code = 'CONFLICT', message = 'Conflict') {
    return new AppError(409, code, message);
  }

  static rateLimited(code = 'RATE_LIMITED', message = 'Too many requests', details) {
    return new AppError(429, code, message, details);
  }
}

module.exports = AppError;

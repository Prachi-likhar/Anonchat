const AppError = require('../utils/AppError');

/**
 * Catch-all 404 middleware for unmatched routes.
 */
function notFound(_req, _res, next) {
  next(AppError.notFound('Route not found'));
}

module.exports = notFound;

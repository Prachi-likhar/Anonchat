const AppError = require('../utils/AppError');

/**
 * Requires req.user.role === 'admin'. Must run after `authenticate`.
 */
function requireAdmin(req, _res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return next(AppError.forbidden('FORBIDDEN', 'Admin access required'));
  }
  return next();
}

module.exports = requireAdmin;

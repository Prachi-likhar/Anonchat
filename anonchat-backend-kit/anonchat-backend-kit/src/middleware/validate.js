const { ZodError } = require('zod');
const AppError = require('../utils/AppError');

/**
 * Validates req.body, req.query, and/or req.params against Zod schemas.
 * Stores parsed values on req.validated and updates req.body / req.params.
 * Note: req.query is a read-only getter in Express 5, so validated query lives on req.validated.query.
 * @param {{ body?: import('zod').ZodTypeAny, query?: import('zod').ZodTypeAny, params?: import('zod').ZodTypeAny }} schemas
 * @returns {import('express').RequestHandler}
 */
function validate(schemas = {}) {
  return (req, _res, next) => {
    try {
      req.validated = req.validated || {};

      if (schemas.params) {
        const parsedParams = schemas.params.parse(req.params);
        req.params = parsedParams;
        req.validated.params = parsedParams;
      }

      if (schemas.query) {
        req.validated.query = schemas.query.parse(req.query);
      }

      if (schemas.body) {
        const parsedBody = schemas.body.parse(req.body);
        req.body = parsedBody;
        req.validated.body = parsedBody;
      }

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));
        return next(AppError.badRequest('Validation failed', { issues }));
      }
      return next(err);
    }
  };
}

module.exports = validate;

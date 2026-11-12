const AppError = require('./AppError');

/**
 * Escapes `%`, `_`, and `\` in SQL ILIKE patterns.
 * @param {string} value
 * @returns {string}
 */
function escapeLike(value) {
  return String(value).replace(/[\\%_]/g, '\\$&');
}

/**
 * Encodes a cursor payload into an opaque base64url string.
 * @param {Record<string, unknown>} payload
 * @returns {string}
 */
function encodeCursor(payload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

/**
 * Decodes an opaque base64url cursor and validates its shape.
 * Throws 400 VALIDATION_ERROR on malformed cursors.
 * @param {string | undefined} cursor
 * @param {(obj: Record<string, unknown>) => boolean} [validator]
 * @returns {Record<string, unknown> | null}
 */
function decodeCursor(cursor, validator) {
  if (!cursor) return null;
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Invalid cursor object');
    }
    if (validator && !validator(parsed)) {
      throw new Error('Invalid cursor fields');
    }
    return parsed;
  } catch {
    throw AppError.badRequest('Invalid pagination cursor');
  }
}

/**
 * Slices limit+1 query rows into { items, nextCursor }.
 * @template T
 * @param {T[]} rows
 * @param {number} limit
 * @param {(lastRow: T) => Record<string, unknown>} cursorSelector
 * @returns {{ rows: T[], nextCursor: string | null }}
 */
function slicePage(rows, limit, cursorSelector) {
  if (rows.length <= limit) {
    return { rows, nextCursor: null };
  }
  const pageRows = rows.slice(0, limit);
  const lastRow = pageRows[pageRows.length - 1];
  return {
    rows: pageRows,
    nextCursor: encodeCursor(cursorSelector(lastRow)),
  };
}

module.exports = {
  escapeLike,
  encodeCursor,
  decodeCursor,
  slicePage,
};

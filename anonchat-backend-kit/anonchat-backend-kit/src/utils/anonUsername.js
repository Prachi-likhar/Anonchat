const crypto = require('crypto');

const BASE_MIN = 100;
const BASE_MAX = 9999;

/**
 * Generates a candidate anonymous username like `Anonymous_4821`.
 * @param {number} maxNumber
 * @returns {string}
 */
function generateAnonUsernameCandidate(maxNumber = BASE_MAX) {
  const num = crypto.randomInt(BASE_MIN, maxNumber + 1);
  return `Anonymous_${num}`;
}

/**
 * Returns true if the PostgreSQL error is a unique-constraint violation on users.anon_username.
 * @param {unknown} err
 * @returns {boolean}
 */
function isAnonUsernameCollision(err) {
  if (!err || err.code !== '23505') return false;
  if (err.constraint && err.constraint.includes('anon_username')) return true;
  const text = `${err.detail || ''} ${err.message || ''}`;
  return text.includes('anon_username');
}

/**
 * Executes an insert callback with generated `Anonymous_<N>` usernames.
 * Retries up to 10 times per range tier, widening the range x10 on collisions.
 * @template T
 * @param {(anonUsername: string) => Promise<T>} insertFn
 * @param {{ maxAttemptsPerTier?: number, maxTiers?: number }} [opts]
 * @returns {Promise<T>}
 */
async function withUniqueAnonUsername(insertFn, opts = {}) {
  const maxAttemptsPerTier = opts.maxAttemptsPerTier ?? 10;
  const maxTiers = opts.maxTiers ?? 4;
  let maxNumber = BASE_MAX;

  for (let tier = 0; tier < maxTiers; tier += 1) {
    for (let attempt = 0; attempt < maxAttemptsPerTier; attempt += 1) {
      const candidate = generateAnonUsernameCandidate(maxNumber);
      try {
        return await insertFn(candidate);
      } catch (err) {
        if (!isAnonUsernameCollision(err)) {
          throw err;
        }
      }
    }
    maxNumber = maxNumber * 10 + 9;
  }

  throw new Error('Unable to allocate unique anonymous username');
}

module.exports = {
  generateAnonUsernameCandidate,
  isAnonUsernameCollision,
  withUniqueAnonUsername,
};

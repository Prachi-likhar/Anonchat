/**
 * Seed super-admin account (implemented fully in Phase 6).
 */
const logger = require('../src/utils/logger');

async function seedAdmin() {
  logger.info('seed:admin will be implemented in Phase 6 (Admin & Moderation).');
}

if (require.main === module) {
  seedAdmin()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error({ err }, 'seed:admin failed');
      process.exit(1);
    });
}

module.exports = { seedAdmin };

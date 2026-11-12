const bcrypt = require('bcrypt');
const { env } = require('../src/config/env');
const { pool, closePool } = require('../src/db/pool');
const logger = require('../src/utils/logger');

/**
 * Idempotently creates or updates the super-admin account from SUPER_ADMIN_EMAIL & SEED_ADMIN_PASSWORD.
 */
async function seedAdmin(db = pool) {
  const email = env.SUPER_ADMIN_EMAIL.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(env.SEED_ADMIN_PASSWORD, env.BCRYPT_COST);

  const { rows } = await db.query(
    `INSERT INTO users (
       anon_username, full_name, email, password_hash, gender, role, status, email_verified_at
     )
     VALUES ('Anonymous_Admin', 'Admin', $1, $2, 'male', 'admin', 'active', now())
     ON CONFLICT (email) DO UPDATE
       SET role = 'admin',
           status = 'active',
           email_verified_at = COALESCE(users.email_verified_at, now()),
           updated_at = now()
     RETURNING id, anon_username, role`,
    [email, passwordHash],
  );

  return rows[0];
}

if (require.main === module) {
  seedAdmin()
    .then((admin) => {
      logger.info({ id: admin.id, anonUsername: admin.anon_username }, 'Super-admin seeded');
      return closePool();
    })
    .then(() => process.exit(0))
    .catch(async (err) => {
      logger.error({ err }, 'seed:admin failed');
      try {
        await closePool();
      } catch {
        // Ignore pool close errors during failure exit
      }
      process.exit(1);
    });
}

module.exports = { seedAdmin };

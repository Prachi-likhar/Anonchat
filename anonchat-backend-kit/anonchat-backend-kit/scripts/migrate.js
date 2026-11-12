const fs = require('fs/promises');
const path = require('path');

const DEFAULT_MIGRATIONS_DIR = path.resolve(__dirname, '..', 'db', 'migrations');

/**
 * Runs pending .sql migrations in lexical filename order inside transactions.
 * Tracks applied filenames in `schema_migrations`.
 * @param {{ db?: { query: Function, withTransaction: Function }, migrationsDir?: string, log?: { info: Function } }} [options]
 * @returns {Promise<string[]>} List of newly applied migration filenames
 */
async function runMigrations(options = {}) {
  const db = options.db || require('../src/db/pool');
  const migrationsDir = options.migrationsDir || DEFAULT_MIGRATIONS_DIR;
  const log = options.log || require('../src/utils/logger');

  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const entries = await fs.readdir(migrationsDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort();

  const { rows } = await db.query('SELECT filename FROM schema_migrations');
  const applied = new Set(rows.map((r) => r.filename));
  const newlyApplied = [];

  for (const filename of files) {
    if (applied.has(filename)) {
      continue;
    }

    const sql = await fs.readFile(path.join(migrationsDir, filename), 'utf8');
    await db.withTransaction(async (client) => {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
    });

    log.info({ migration: filename }, 'Applied database migration');
    newlyApplied.push(filename);
  }

  return newlyApplied;
}

if (require.main === module) {
  const { closePool } = require('../src/db/pool');
  const logger = require('../src/utils/logger');

  runMigrations()
    .then((applied) => {
      logger.info({ count: applied.length, applied }, 'Migration run complete');
      return closePool();
    })
    .then(() => process.exit(0))
    .catch(async (err) => {
      logger.error({ err }, 'Migration failed');
      try {
        await closePool();
      } catch {
        // Ignore pool close errors during failure exit
      }
      process.exit(1);
    });
}

module.exports = { runMigrations };

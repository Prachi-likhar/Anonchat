const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { runMigrations } = require('../scripts/migrate');

describe('migration runner', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'anonchat-mig-'));
    await fs.writeFile(path.join(tmpDir, '002_second.sql'), 'CREATE TABLE two (id int);');
    await fs.writeFile(path.join(tmpDir, '001_first.sql'), 'CREATE TABLE one (id int);');
    await fs.writeFile(path.join(tmpDir, 'ignore.txt'), 'not sql');
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('applies pending migrations in order and skips already-applied ones', async () => {
    const appliedRows = [];
    const executedSql = [];

    const fakeDb = {
      query: jest.fn(async (sql) => {
        if (sql.startsWith('SELECT filename FROM schema_migrations')) {
          return { rows: appliedRows.map((filename) => ({ filename })) };
        }
        return { rows: [] };
      }),
      withTransaction: jest.fn(async (fn) => {
        const client = {
          query: jest.fn(async (sql, params) => {
            if (sql.startsWith('INSERT INTO schema_migrations')) {
              appliedRows.push(params[0]);
            } else {
              executedSql.push(sql);
            }
            return { rows: [] };
          }),
        };
        return fn(client);
      }),
    };

    const silentLog = { info: jest.fn() };

    const firstRun = await runMigrations({
      db: fakeDb,
      migrationsDir: tmpDir,
      log: silentLog,
    });

    expect(firstRun).toEqual(['001_first.sql', '002_second.sql']);
    expect(executedSql).toEqual(['CREATE TABLE one (id int);', 'CREATE TABLE two (id int);']);

    const secondRun = await runMigrations({
      db: fakeDb,
      migrationsDir: tmpDir,
      log: silentLog,
    });

    expect(secondRun).toEqual([]);
  });
});

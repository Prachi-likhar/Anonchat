/**
 * Load sanity test for message sending & anti-spam burst enforcement.
 * Runs standalone against an ephemeral Express server with mocked DB pool so it
 * exercises the full Express middleware + validation + auth + anti-spam + serializer path.
 */
const http = require('http');

function setSafeTestEnv() {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL =
    process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/anonchat_test';
  process.env.JWT_ACCESS_SECRET =
    process.env.JWT_ACCESS_SECRET || 'load-sanity-access-secret-at-least-32-chars';
  process.env.JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET || 'load-sanity-refresh-secret-at-least-32-chars';
  process.env.OTP_PEPPER = process.env.OTP_PEPPER || 'load-sanity-pepper';
  process.env.SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'owner@example.com';
  process.env.SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123';
}

function sendJsonPost(url, token, payload) {
  return new Promise((resolve, reject) => {
    const start = process.hrtime.bigint();
    const body = JSON.stringify(payload);
    const req = http.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          Authorization: `Bearer ${token}`,
        },
      },
      (res) => {
        res.resume();
        res.on('end', () => {
          const latencyMs = Number(process.hrtime.bigint() - start) / 1e6;
          resolve({ status: res.statusCode, latencyMs });
        });
      },
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function runLoadSanity({ totalRequests = 30 } = {}) {
  setSafeTestEnv();

  const poolModule = require('../src/db/pool');
  const USER_ID = '11111111-1111-4111-8111-111111111111';
  const OTHER_ID = '22222222-2222-4222-8222-222222222222';
  const CONVO_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  let msgCounter = 0;
  poolModule.pool.query = async (sql) => {
    if (sql.includes('FROM users')) {
      return {
        rows: [
          {
            id: USER_ID,
            role: 'user',
            status: 'active',
            suspended_until: null,
            status_reason: null,
            email_verified_at: '2026-11-12T10:00:00.000Z',
          },
        ],
      };
    }
    if (sql.includes('FROM conversations')) {
      return {
        rows: [{ id: CONVO_ID, user_a: USER_ID, user_b: OTHER_ID, status: 'active' }],
      };
    }
    return { rows: [] };
  };

  poolModule.withTransaction = async (fn) => {
    const client = {
      query: async (sql, params) => {
        if (sql.includes('INSERT INTO messages')) {
          msgCounter += 1;
          return {
            rows: [
              {
                id: `msg-${msgCounter}`,
                conversation_id: CONVO_ID,
                sender_id: USER_ID,
                body: params[2],
                client_msg_id: params[3],
                read_at: null,
                created_at: new Date().toISOString(),
              },
            ],
          };
        }
        return { rows: [] };
      },
    };
    return fn(client);
  };

  const app = require('../src/app');
  const tokenService = require('../src/services/tokenService');
  const antiSpam = require('../src/services/antiSpam');
  antiSpam.clearAntiSpam();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  try {
    const { port } = server.address();
    const url = `http://127.0.0.1:${port}/api/conversations/${CONVO_ID}/messages`;
    const token = tokenService.signAccessToken({ userId: USER_ID, role: 'user' });

    const results = [];
    for (let i = 0; i < totalRequests; i += 1) {
      results.push(await sendJsonPost(url, token, { body: `Load message #${i}` }));
    }

    const latencies = results.map((r) => r.latencyMs).sort((a, b) => a - b);
    const createdCount = results.filter((r) => r.status === 201).length;
    const rateLimitedCount = results.filter((r) => r.status === 429).length;
    const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
    const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;

    return {
      totalRequests,
      createdCount,
      rateLimitedCount,
      p50Ms: Number(p50.toFixed(2)),
      p95Ms: Number(p95.toFixed(2)),
    };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

if (require.main === module) {
  runLoadSanity()
    .then((summary) => {
      console.warn('Load sanity summary:', JSON.stringify(summary));
      if (summary.createdCount !== 5 || summary.rateLimitedCount !== 25) {
        throw new Error(`Unexpected burst counts: ${JSON.stringify(summary)}`);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('Load sanity failed:', err);
      process.exit(1);
    });
}

module.exports = { runLoadSanity };


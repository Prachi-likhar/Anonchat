const request = require('supertest');

jest.mock('../src/db/pool', () => ({
  pool: { query: jest.fn(), end: jest.fn() },
  query: jest.fn(),
  withTransaction: jest.fn(),
  closePool: jest.fn(),
}));

const app = require('../src/app');
const { pool, withTransaction } = require('../src/db/pool');
const tokenService = require('../src/services/tokenService');
const presenceService = require('../src/services/presenceService');
const { clearAuthCache } = require('../src/middleware/auth');

const ME_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_ID = '22222222-2222-4222-8222-222222222222';
const THIRD_ID = '33333333-3333-4333-8333-333333333333';

function authHeader(userId = ME_ID) {
  const token = tokenService.signAccessToken({ userId, role: 'user' });
  return `Bearer ${token}`;
}

function mockAuthenticatedUser(userId = ME_ID) {
  pool.query.mockResolvedValueOnce({
    rows: [
      {
        id: userId,
        role: 'user',
        status: 'active',
        suspended_until: null,
        status_reason: null,
        email_verified_at: '2026-11-12T10:00:00.000Z',
      },
    ],
  });
}

describe('Members discovery and Blocks API', () => {
  beforeEach(() => {
    clearAuthCache();
    presenceService.clearPresence();
    jest.clearAllMocks();
  });

  test('GET /api/members enforces auth, filters, ILIKE escaping, exclusions, and pagination', async () => {
    const unauth = await request(app).get('/api/members');
    expect(unauth.status).toBe(401);

    mockAuthenticatedUser();
    presenceService.addConnection(OTHER_ID);

    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: OTHER_ID,
          anon_username: 'Anonymous_4821',
          gender: 'female',
          avatar_color: '#10B981',
        },
        {
          id: THIRD_ID,
          anon_username: 'Anonymous_9001',
          gender: 'female',
          avatar_color: '#7C3AED',
        },
      ],
    });

    const res = await request(app)
      .get('/api/members?filter=female&search=48_21%25&limit=1')
      .set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([
      {
        id: OTHER_ID,
        anonUsername: 'Anonymous_4821',
        gender: 'female',
        avatarColor: '#10B981',
        isOnline: true,
        blockedByMe: false,
      },
    ]);
    expect(typeof res.body.nextCursor).toBe('string');

    const [sql, params] = pool.query.mock.calls[1];
    expect(sql).toContain("u.role <> 'admin'");
    expect(sql).toContain('NOT EXISTS');
    expect(sql).toContain('blocks');
    expect(params).toEqual([ME_ID, 'female', '%48\\_21\\%%', 2]);

    // Ensure JSON never contains private fields
    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toMatch(/email|fullName|password|created_at|last_seen/i);
  });

  test('GET /api/members?filter=online short-circuits when no other members are online', async () => {
    mockAuthenticatedUser();
    presenceService.addConnection(ME_ID);

    const res = await request(app)
      .get('/api/members?filter=online')
      .set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [], nextCursor: null });
    expect(pool.query).toHaveBeenCalledTimes(1); // Only authenticate DB call
  });

  test('GET /api/members rejects malformed cursor with 400 VALIDATION_ERROR', async () => {
    mockAuthenticatedUser();

    const res = await request(app)
      .get('/api/members?cursor=bad_cursor')
      .set('Authorization', authHeader());

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('POST /api/blocks rejects self-block, missing/admin target, and blocks + ends conversation', async () => {
    mockAuthenticatedUser();
    const selfRes = await request(app)
      .post('/api/blocks')
      .set('Authorization', authHeader())
      .send({ memberId: ME_ID });
    expect(selfRes.status).toBe(400);

    // Missing or admin target returns 404
    withTransaction.mockImplementation(async (fn) => {
      const client = {
        query: jest.fn().mockResolvedValueOnce({ rows: [] }),
      };
      return fn(client);
    });
    const missingRes = await request(app)
      .post('/api/blocks')
      .set('Authorization', authHeader())
      .send({ memberId: OTHER_ID });
    expect(missingRes.status).toBe(404);

    // Valid block + end active conversation in canonical order
    const txQueries = [];
    withTransaction.mockImplementation(async (fn) => {
      const client = {
        query: jest.fn(async (sql, params) => {
          txQueries.push({ sql, params });
          if (sql.includes('FROM users')) return { rows: [{ id: OTHER_ID }] };
          if (sql.includes('UPDATE conversations')) return { rows: [{ id: 'convo-1' }] };
          return { rows: [] };
        }),
      };
      return fn(client);
    });

    const blockRes = await request(app)
      .post('/api/blocks')
      .set('Authorization', authHeader())
      .send({ memberId: OTHER_ID });

    expect(blockRes.status).toBe(204);
    expect(txQueries).toHaveLength(3);
    expect(txQueries[1].sql).toContain('INSERT INTO blocks');
    expect(txQueries[1].params).toEqual([ME_ID, OTHER_ID]);
    expect(txQueries[2].sql).toContain('UPDATE conversations');
    expect(txQueries[2].params).toEqual([ME_ID, OTHER_ID, ME_ID]);
  });

  test('GET /api/blocks and DELETE /api/blocks/:memberId work and protect privacy', async () => {
    mockAuthenticatedUser();
    presenceService.addConnection(OTHER_ID);

    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: OTHER_ID,
          anon_username: 'Anonymous_4821',
          gender: 'female',
          avatar_color: '#EF4444',
        },
      ],
    });

    const listRes = await request(app).get('/api/blocks').set('Authorization', authHeader());
    expect(listRes.status).toBe(200);
    expect(listRes.body).toEqual({
      items: [
        {
          id: OTHER_ID,
          anonUsername: 'Anonymous_4821',
          gender: 'female',
          avatarColor: '#EF4444',
          isOnline: false,
          blockedByMe: true,
        },
      ],
    });

    pool.query.mockResolvedValueOnce({ rows: [] });
    const unblockRes = await request(app)
      .delete(`/api/blocks/${OTHER_ID}`)
      .set('Authorization', authHeader());
    expect(unblockRes.status).toBe(204);
    expect(pool.query).toHaveBeenLastCalledWith(
      'DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2',
      [ME_ID, OTHER_ID],
    );
  });
});

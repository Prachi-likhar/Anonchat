const request = require('supertest');

jest.mock('../src/db/pool', () => ({
  pool: { query: jest.fn(), end: jest.fn() },
  query: jest.fn(),
  withTransaction: jest.fn(),
  closePool: jest.fn(),
}));

jest.mock('../src/sockets/emitter', () => {
  const actual = jest.requireActual('../src/sockets/emitter');
  return {
    ...actual,
    emitForceLogout: jest.fn(),
  };
});

const app = require('../src/app');
const { pool, withTransaction } = require('../src/db/pool');
const { emitForceLogout } = require('../src/sockets/emitter');
const tokenService = require('../src/services/tokenService');
const presenceService = require('../src/services/presenceService');
const { clearAuthCache } = require('../src/middleware/auth');
const { seedAdmin } = require('../scripts/seedAdmin');

const USER_ID = '11111111-1111-4111-8111-111111111111';
const TARGET_ID = '22222222-2222-4222-8222-222222222222';
const ADMIN_ID = '99999999-9999-4999-8999-999999999999';
const CONVO_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const REPORT_ID = 'rrrrrrrr-rrrr-4rrr-8rrr-rrrrrrrrrrrr'.replace(/r/g, '3');

function tokenFor(userId, role = 'user') {
  return `Bearer ${tokenService.signAccessToken({ userId, role })}`;
}

function mockAuth(userId, role = 'user') {
  pool.query.mockResolvedValueOnce({
    rows: [
      {
        id: userId,
        role,
        status: 'active',
        suspended_until: null,
        status_reason: null,
        email_verified_at: '2026-11-12T10:00:00.000Z',
      },
    ],
  });
}

describe('Reports & Admin API (docs/ADMIN.md)', () => {
  beforeEach(() => {
    clearAuthCache();
    presenceService.clearPresence();
    jest.clearAllMocks();
  });

  test('non-admin receives 403 FORBIDDEN on all /api/admin endpoints', async () => {
    mockAuth(USER_ID, 'user');
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', tokenFor(USER_ID, 'user'));

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('POST /api/reports enforces participant check and stores last-30-message snapshot', async () => {
    mockAuth(USER_ID, 'user');

    // Non-participant conversation -> 404
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: TARGET_ID }] })
      .mockResolvedValueOnce({ rows: [] });
    const badConvo = await request(app)
      .post('/api/reports')
      .set('Authorization', tokenFor(USER_ID))
      .send({ memberId: TARGET_ID, conversationId: CONVO_ID, reason: 'spam' });
    expect(badConvo.status).toBe(404);

    // Valid report with chronological snapshot
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: TARGET_ID }] })
      .mockResolvedValueOnce({ rows: [{ id: CONVO_ID }] })
      .mockResolvedValueOnce({
        rows: [
          { sender: 'Anonymous_200', body: 'second', at: '2026-11-12T12:01:00.000Z' },
          { sender: 'Anonymous_100', body: 'first', at: '2026-11-12T12:00:00.000Z' },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ id: REPORT_ID }] });

    const okRes = await request(app)
      .post('/api/reports')
      .set('Authorization', tokenFor(USER_ID))
      .send({
        memberId: TARGET_ID,
        conversationId: CONVO_ID,
        reason: 'harassment',
        details: 'Rude messages',
      });

    expect(okRes.status).toBe(201);
    expect(okRes.body).toEqual({ id: REPORT_ID });

    const insertCall = pool.query.mock.calls.find(([sql]) => sql.includes('INSERT INTO reports'));
    const storedSnapshot = JSON.parse(insertCall[1][5]);
    expect(storedSnapshot).toEqual([
      { sender: 'Anonymous_100', body: 'first', at: '2026-11-12T12:00:00.000Z' },
      { sender: 'Anonymous_200', body: 'second', at: '2026-11-12T12:01:00.000Z' },
    ]);
  });

  test('GET /api/admin/stats returns SQL counts + presenceService onlineNow', async () => {
    mockAuth(ADMIN_ID, 'admin');
    presenceService.addConnection(USER_ID);
    presenceService.addConnection(TARGET_ID);

    pool.query
      .mockResolvedValueOnce({
        rows: [
          {
            total_users: 42,
            male: 20,
            female: 22,
            new_today: 3,
            new_7d: 12,
            suspended: 1,
            banned: 2,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ open_reports: 4 }] })
      .mockResolvedValueOnce({ rows: [{ messages_today: 120 }] })
      .mockResolvedValueOnce({ rows: [{ conversations_active: 9 }] });

    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', tokenFor(ADMIN_ID, 'admin'));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      totalUsers: 42,
      male: 20,
      female: 22,
      onlineNow: 2,
      newToday: 3,
      new7d: 12,
      suspended: 1,
      banned: 2,
      openReports: 4,
      messagesToday: 120,
      conversationsActive: 9,
    });
  });

  test('GET /api/admin/users escapes ILIKE search and omits fullName & password_hash', async () => {
    mockAuth(ADMIN_ID, 'admin');
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: TARGET_ID,
          anon_username: 'Anonymous_4821',
          full_name: 'Hidden Real Name',
          email: 'target@example.com',
          password_hash: 'secret-hash',
          gender: 'female',
          status: 'active',
          role: 'user',
          report_count: 2,
          created_at: '2026-11-12T09:00:00.000Z',
          last_seen_at: null,
          suspended_until: null,
        },
      ],
    });

    const res = await request(app)
      .get('/api/admin/users?q=target_1%25')
      .set('Authorization', tokenFor(ADMIN_ID, 'admin'));

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].email).toBe('target@example.com');
    expect(res.body.items[0].fullName).toBeUndefined();
    expect(res.body.items[0].password_hash).toBeUndefined();
    expect(pool.query.mock.calls[1][1]).toContain('%target\\_1\\%%');
  });

  test('suspend revokes tokens, writes audit log, and emits force-logout; prevents self-ban and last-admin ban', async () => {
    mockAuth(ADMIN_ID, 'admin');

    // Prevent self-ban
    withTransaction.mockImplementation(async (fn) => fn({ query: jest.fn() }));
    const selfBan = await request(app)
      .post(`/api/admin/users/${ADMIN_ID}/ban`)
      .set('Authorization', tokenFor(ADMIN_ID, 'admin'))
      .send({ reason: 'Oops' });
    expect(selfBan.status).toBe(400);

    // Prevent banning last active admin
    withTransaction.mockImplementation(async (fn) => {
      const client = {
        query: jest
          .fn()
          .mockResolvedValueOnce({ rows: [{ id: TARGET_ID, role: 'admin', status: 'active' }] })
          .mockResolvedValueOnce({ rows: [{ admin_count: 1 }] }),
      };
      return fn(client);
    });
    const lastAdminBan = await request(app)
      .post(`/api/admin/users/${TARGET_ID}/ban`)
      .set('Authorization', tokenFor(ADMIN_ID, 'admin'))
      .send({ reason: 'Remove admin' });
    expect(lastAdminBan.status).toBe(400);

    // Valid suspend revokes refresh tokens, writes audit, emits force-logout
    const txSql = [];
    withTransaction.mockImplementation(async (fn) => {
      const client = {
        query: jest.fn(async (sql) => {
          txSql.push(sql);
          if (sql.includes('FOR UPDATE')) {
            return { rows: [{ id: TARGET_ID, role: 'user', status: 'active' }] };
          }
          return { rows: [] };
        }),
      };
      return fn(client);
    });

    const futureIso = new Date(Date.now() + 3600 * 1000).toISOString();
    const suspendRes = await request(app)
      .post(`/api/admin/users/${TARGET_ID}/suspend`)
      .set('Authorization', tokenFor(ADMIN_ID, 'admin'))
      .send({ until: futureIso, reason: 'Harassment' });

    expect(suspendRes.status).toBe(204);
    expect(txSql.some((s) => s.includes('UPDATE refresh_tokens'))).toBe(true);
    expect(txSql.some((s) => s.includes('INSERT INTO admin_audit_log'))).toBe(true);
    expect(emitForceLogout).toHaveBeenCalledWith({ userId: TARGET_ID, reason: 'suspended' });
  });

  test('PATCH /api/admin/reports/:id resolves report with ban and GET shows Reporter/Reported labels', async () => {
    mockAuth(ADMIN_ID, 'admin');

    withTransaction.mockImplementation(async (fn) => {
      const client = {
        query: jest
          .fn()
          .mockResolvedValueOnce({
            rows: [{ id: REPORT_ID, reported_id: TARGET_ID, status: 'open' }],
          }) // report lock
          .mockResolvedValueOnce({ rows: [] }) // update report
          .mockResolvedValueOnce({ rows: [{ id: TARGET_ID, role: 'user', status: 'active' }] }) // target lock
          .mockResolvedValueOnce({ rows: [] }) // ban user
          .mockResolvedValueOnce({ rows: [] }) // revoke tokens
          .mockResolvedValueOnce({ rows: [] }) // ban audit
          .mockResolvedValueOnce({ rows: [] }), // report audit
      };
      return fn(client);
    });

    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: REPORT_ID,
          conversation_id: CONVO_ID,
          reason: 'harassment',
          details: 'Abuse',
          snapshot: [
            { sender: 'Anonymous_100', body: 'hi', at: '2026-11-12T12:00:00.000Z' },
            { sender: 'Anonymous_200', body: 'bad msg', at: '2026-11-12T12:01:00.000Z' },
          ],
          status: 'resolved',
          resolution_note: 'Confirmed abuse',
          created_at: '2026-11-12T12:05:00.000Z',
          resolved_at: '2026-11-12T12:10:00.000Z',
          reporter_id: USER_ID,
          reporter_anon_username: 'Anonymous_100',
          reported_id: TARGET_ID,
          reported_anon_username: 'Anonymous_200',
          reported_status: 'banned',
          handled_by: ADMIN_ID,
          handled_by_anon_username: 'Anonymous_Admin',
        },
      ],
    });

    const patchRes = await request(app)
      .patch(`/api/admin/reports/${REPORT_ID}`)
      .set('Authorization', tokenFor(ADMIN_ID, 'admin'))
      .send({ status: 'resolved', resolutionNote: 'Confirmed abuse', action: 'ban' });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.status).toBe('resolved');
    expect(patchRes.body.snapshot).toEqual([
      {
        sender: 'Anonymous_100',
        roleLabel: 'Reporter',
        body: 'hi',
        at: '2026-11-12T12:00:00.000Z',
      },
      {
        sender: 'Anonymous_200',
        roleLabel: 'Reported',
        body: 'bad msg',
        at: '2026-11-12T12:01:00.000Z',
      },
    ]);
    expect(emitForceLogout).toHaveBeenCalledWith({ userId: TARGET_ID, reason: 'banned' });
  });

  test('POST /api/admin/users/:id/role enforces SUPER_ADMIN_EMAIL and seedAdmin creates Anonymous_Admin', async () => {
    mockAuth(ADMIN_ID, 'admin');
    pool.query.mockResolvedValueOnce({ rows: [{ email: 'other-admin@example.com' }] });

    const forbiddenRole = await request(app)
      .post(`/api/admin/users/${TARGET_ID}/role`)
      .set('Authorization', tokenFor(ADMIN_ID, 'admin'))
      .send({ role: 'admin' });
    expect(forbiddenRole.status).toBe(403);

    const fakeDb = {
      query: jest.fn().mockResolvedValueOnce({
        rows: [{ id: ADMIN_ID, anon_username: 'Anonymous_Admin', role: 'admin' }],
      }),
    };
    const seeded = await seedAdmin(fakeDb);
    expect(seeded.anon_username).toBe('Anonymous_Admin');
    expect(seeded.role).toBe('admin');
  });
});

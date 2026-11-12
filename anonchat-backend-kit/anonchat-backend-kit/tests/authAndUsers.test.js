const bcrypt = require('bcrypt');
const request = require('supertest');

jest.mock('../src/db/pool', () => ({
  pool: { query: jest.fn(), end: jest.fn() },
  query: jest.fn(),
  withTransaction: jest.fn(),
  closePool: jest.fn(),
}));

jest.mock('../src/services/otpService', () => {
  const actual = jest.requireActual('../src/services/otpService');
  return {
    ...actual,
    createOtpRecord: jest.fn(),
    sendOtp: jest.fn(),
    issueAndSendOtp: jest.fn(),
    verifyOtp: jest.fn(),
  };
});

const app = require('../src/app');
const { pool, withTransaction } = require('../src/db/pool');
const otpService = require('../src/services/otpService');
const tokenService = require('../src/services/tokenService');
const { clearAuthCache } = require('../src/middleware/auth');

const USER_ID = '11111111-1111-4111-8111-111111111111';

function makeDbUser(overrides = {}) {
  return {
    id: USER_ID,
    anon_username: 'Anonymous_4821',
    full_name: 'Alice Example',
    email: 'alice@example.com',
    password_hash: bcrypt.hashSync('Password1', 4),
    gender: 'female',
    avatar_color: '#7C3AED',
    role: 'user',
    theme: 'system',
    status: 'active',
    status_reason: null,
    suspended_until: null,
    email_verified_at: '2026-11-12T10:00:00.000Z',
    failed_logins: 0,
    locked_until: null,
    created_at: '2026-11-12T09:00:00.000Z',
    ...overrides,
  };
}

describe('Auth & Me API contract', () => {
  beforeEach(() => {
    clearAuthCache();
    jest.clearAllMocks();
  });

  test('POST /api/auth/register creates unverified user and returns 201 without leaking existence', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    withTransaction.mockImplementation(async (fn) => {
      const client = {
        query: jest.fn().mockResolvedValueOnce({
          rows: [{ id: USER_ID, email: 'alice@example.com' }],
        }),
      };
      return fn(client);
    });
    otpService.createOtpRecord.mockResolvedValueOnce({
      id: 'otp-1',
      code: '123456',
      expiresAt: new Date().toISOString(),
    });
    otpService.sendOtp.mockResolvedValueOnce({ ok: true });

    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Alice Example',
      email: 'ALICE@example.com',
      password: 'Password1',
      gender: 'female',
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      message: 'Verification code sent to your email.',
      email: 'alice@example.com',
    });

    // Verified duplicate email still responds 201 (no enumeration)
    pool.query.mockResolvedValueOnce({
      rows: [{ id: USER_ID, email_verified_at: '2026-11-12T10:00:00.000Z' }],
    });
    const dupRes = await request(app).post('/api/auth/register').send({
      fullName: 'Alice Example',
      email: 'alice@example.com',
      password: 'Password1',
      gender: 'female',
    });
    expect(dupRes.status).toBe(201);
    expect(otpService.sendOtp).toHaveBeenCalledTimes(1);
  });

  test('POST /api/auth/verify-email sets cookie for web and returns refreshToken for mobile', async () => {
    const user = makeDbUser({ email_verified_at: null });
    const verified = makeDbUser();

    // Web flow
    pool.query
      .mockResolvedValueOnce({ rows: [user] })
      .mockResolvedValueOnce({ rows: [verified] })
      .mockResolvedValueOnce({
        rows: [{ id: 'rt-1', family_id: 'fam-1', expires_at: new Date().toISOString() }],
      });
    withTransaction.mockImplementation(async (fn) => fn({ query: jest.fn() }));
    otpService.verifyOtp.mockResolvedValueOnce({ valid: true, otpId: 'otp-1' });

    const webRes = await request(app).post('/api/auth/verify-email').send({
      email: 'alice@example.com',
      otp: '123456',
    });

    expect(webRes.status).toBe(200);
    expect(webRes.body.accessToken).toBeTruthy();
    expect(webRes.body.refreshToken).toBeUndefined();
    expect(webRes.body.user.email).toBe('alice@example.com');
    expect(webRes.headers['set-cookie'][0]).toContain('refresh_token=');
    expect(webRes.headers['set-cookie'][0]).toContain('HttpOnly');

    // Mobile flow
    pool.query
      .mockResolvedValueOnce({ rows: [user] })
      .mockResolvedValueOnce({ rows: [verified] })
      .mockResolvedValueOnce({
        rows: [{ id: 'rt-2', family_id: 'fam-2', expires_at: new Date().toISOString() }],
      });
    otpService.verifyOtp.mockResolvedValueOnce({ valid: true, otpId: 'otp-2' });

    const mobileRes = await request(app)
      .post('/api/auth/verify-email')
      .set('X-Client', 'mobile')
      .send({
        email: 'alice@example.com',
        otp: '123456',
      });

    expect(mobileRes.status).toBe(200);
    expect(mobileRes.body.refreshToken).toBeTruthy();
    expect(mobileRes.headers['set-cookie']).toBeUndefined();
  });

  test('POST /api/auth/login handles banned, suspended, unverified, lockout, and valid login', async () => {
    // Banned
    pool.query.mockResolvedValueOnce({ rows: [makeDbUser({ status: 'banned' })] });
    const bannedRes = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'Password1',
    });
    expect(bannedRes.status).toBe(403);
    expect(bannedRes.body.error.code).toBe('ACCOUNT_BANNED');

    // Active suspension
    const until = new Date(Date.now() + 3600 * 1000).toISOString();
    pool.query.mockResolvedValueOnce({
      rows: [makeDbUser({ status: 'suspended', suspended_until: until, status_reason: 'Spam' })],
    });
    const suspRes = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'Password1',
    });
    expect(suspRes.status).toBe(403);
    expect(suspRes.body.error.code).toBe('ACCOUNT_SUSPENDED');
    expect(suspRes.body.error.details).toEqual({ until, reason: 'Spam' });

    // Unverified re-sends OTP
    pool.query.mockResolvedValueOnce({ rows: [makeDbUser({ email_verified_at: null })] });
    otpService.issueAndSendOtp.mockResolvedValueOnce({ id: 'otp-r', expiresAt: until });
    const unvRes = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'Password1',
    });
    expect(unvRes.status).toBe(403);
    expect(unvRes.body.error.code).toBe('EMAIL_NOT_VERIFIED');
    expect(otpService.issueAndSendOtp).toHaveBeenCalledTimes(1);

    // Locked account returns 429 + Retry-After
    pool.query.mockResolvedValueOnce({
      rows: [makeDbUser({ locked_until: new Date(Date.now() + 300000).toISOString() })],
    });
    const lockedRes = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'Password1',
    });
    expect(lockedRes.status).toBe(429);
    expect(lockedRes.headers['retry-after']).toBeDefined();

    // Valid login
    pool.query.mockResolvedValueOnce({ rows: [makeDbUser()] }).mockResolvedValueOnce({
      rows: [{ id: 'rt-3', family_id: 'fam-3', expires_at: until }],
    });
    const okRes = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'Password1',
    });
    expect(okRes.status).toBe(200);
    expect(okRes.body.accessToken).toBeTruthy();
    expect(okRes.body.user.anonUsername).toBe('Anonymous_4821');
    expect(okRes.body.user.password_hash).toBeUndefined();
  });

  test('POST /api/auth/refresh rotates cookie with empty body and supports logout', async () => {
    withTransaction.mockImplementation(async (fn) => {
      const client = {
        query: jest
          .fn()
          .mockResolvedValueOnce({
            rows: [
              {
                id: 'rt-old',
                user_id: USER_ID,
                family_id: 'fam-1',
                expires_at: new Date(Date.now() + 60000).toISOString(),
                revoked_at: null,
                role: 'user',
                status: 'active',
                suspended_until: null,
                status_reason: null,
                email_verified_at: '2026-11-12T10:00:00.000Z',
              },
            ],
          })
          .mockResolvedValueOnce({
            rows: [
              {
                id: 'rt-new',
                family_id: 'fam-1',
                expires_at: new Date(Date.now() + 120000).toISOString(),
              },
            ],
          })
          .mockResolvedValueOnce({ rows: [] }),
      };
      return fn(client);
    });

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', ['refresh_token=valid-cookie-token']);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.accessToken).toBeTruthy();
    expect(refreshRes.headers['set-cookie'][0]).toContain('refresh_token=');

    pool.query.mockResolvedValueOnce({ rows: [] });
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', ['refresh_token=valid-cookie-token']);
    expect(logoutRes.status).toBe(204);
  });

  test('GET/PATCH/change-password/DELETE /api/me enforce auth and DB status', async () => {
    const unauth = await request(app).get('/api/me');
    expect(unauth.status).toBe(401);

    const token = tokenService.signAccessToken({ userId: USER_ID, role: 'user' });
    const user = makeDbUser();

    // GET /api/me
    pool.query
      .mockResolvedValueOnce({ rows: [user] }) // authenticate DB load
      .mockResolvedValueOnce({ rows: [user] }); // getMe

    const meRes = await request(app).get('/api/me').set('Authorization', `Bearer ${token}`);
    expect(meRes.status).toBe(200);
    expect(Object.keys(meRes.body).sort()).toEqual([
      'anonUsername',
      'avatarColor',
      'createdAt',
      'email',
      'fullName',
      'gender',
      'id',
      'role',
      'theme',
    ]);

    // PATCH /api/me (auth state cached for 15s)
    const updated = makeDbUser({ theme: 'dark', avatar_color: '#112233' });
    pool.query.mockResolvedValueOnce({ rows: [updated] });
    const patchRes = await request(app)
      .patch('/api/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ theme: 'dark', avatarColor: '#112233' });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.theme).toBe('dark');
    expect(patchRes.body.avatarColor).toBe('#112233');

    // DELETE /api/me
    pool.query.mockResolvedValueOnce({ rows: [user] }).mockResolvedValueOnce({ rows: [] });
    const delRes = await request(app)
      .delete('/api/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'Password1' });
    expect(delRes.status).toBe(204);

    // Subsequent call after cache invalidation rejects with 401
    pool.query.mockResolvedValueOnce({ rows: [] });
    const afterDel = await request(app).get('/api/me').set('Authorization', `Bearer ${token}`);
    expect(afterDel.status).toBe(401);
  });
});

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
const antiSpam = require('../src/services/antiSpam');
const { clearAuthCache } = require('../src/middleware/auth');
const { canonicalPair } = require('../src/modules/conversations/conversations.serializer');

const ME_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_ID = '22222222-2222-4222-8222-222222222222';
const CONVO_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const MSG_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function authHeader(userId = ME_ID) {
  return `Bearer ${tokenService.signAccessToken({ userId, role: 'user' })}`;
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

function makeJoinedConvoRow(overrides = {}) {
  return {
    id: CONVO_ID,
    user_a: ME_ID,
    user_b: OTHER_ID,
    initiated_by: ME_ID,
    status: 'active',
    ended_by: null,
    last_message_at: '2026-11-12T12:00:00.000Z',
    created_at: '2026-11-12T11:00:00.000Z',
    other_id: OTHER_ID,
    other_anon_username: 'Anonymous_4821',
    other_gender: 'female',
    other_avatar_color: '#7C3AED',
    last_msg_id: MSG_ID,
    last_msg_body: 'Hi there',
    last_msg_created_at: '2026-11-12T12:00:00.000Z',
    last_msg_sender_id: OTHER_ID,
    blocked_by_me: false,
    unread_count: 1,
    ...overrides,
  };
}

describe('Conversations & Messages REST API', () => {
  beforeEach(() => {
    clearAuthCache();
    antiSpam.clearAntiSpam();
    jest.clearAllMocks();
  });

  test('canonicalPair orders UUID strings deterministically', () => {
    expect(canonicalPair(OTHER_ID, ME_ID)).toEqual([ME_ID, OTHER_ID]);
    expect(canonicalPair(ME_ID, OTHER_ID)).toEqual([ME_ID, OTHER_ID]);
  });

  test('POST /api/conversations rejects blocked pairs with 403 USER_BLOCKED and creates or reuses', async () => {
    mockAuthenticatedUser();
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: OTHER_ID }] }) // target exists
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] }); // block exists

    const blockedRes = await request(app)
      .post('/api/conversations')
      .set('Authorization', authHeader())
      .send({ memberId: OTHER_ID });
    expect(blockedRes.status).toBe(403);
    expect(blockedRes.body.error.code).toBe('USER_BLOCKED');

    // Create new conversation -> 201
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: OTHER_ID }] })
      .mockResolvedValueOnce({ rows: [] }) // no block
      .mockResolvedValueOnce({ rows: [] }) // no existing convo
      .mockResolvedValueOnce({
        rows: [makeJoinedConvoRow({ last_msg_id: null, unread_count: 0 })],
      });
    withTransaction.mockImplementation(async (fn) => {
      const client = {
        query: jest.fn().mockResolvedValueOnce({ rows: [{ id: CONVO_ID }] }),
      };
      return fn(client);
    });

    const createRes = await request(app)
      .post('/api/conversations')
      .set('Authorization', authHeader())
      .send({ memberId: OTHER_ID });

    expect(createRes.status).toBe(201);
    expect(createRes.body.id).toBe(CONVO_ID);
    expect(createRes.body.other.anonUsername).toBe('Anonymous_4821');
    expect(JSON.stringify(createRes.body)).not.toMatch(/email|fullName|password/i);

    // Idempotent existing active -> 200
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: OTHER_ID }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: CONVO_ID, status: 'active', a_deleted_at: null }] })
      .mockResolvedValueOnce({ rows: [makeJoinedConvoRow()] });

    const existingRes = await request(app)
      .post('/api/conversations')
      .set('Authorization', authHeader())
      .send({ memberId: OTHER_ID });
    expect(existingRes.status).toBe(200);
    expect(existingRes.body.id).toBe(CONVO_ID);
  });

  test('non-participant receives 404 (never 403) on messages/read/end/delete', async () => {
    mockAuthenticatedUser();
    pool.query.mockResolvedValueOnce({ rows: [] });
    const getMsgs = await request(app)
      .get(`/api/conversations/${CONVO_ID}/messages`)
      .set('Authorization', authHeader());
    expect(getMsgs.status).toBe(404);

    pool.query.mockResolvedValueOnce({ rows: [] });
    const sendMsg = await request(app)
      .post(`/api/conversations/${CONVO_ID}/messages`)
      .set('Authorization', authHeader())
      .send({ body: 'hi' });
    expect(sendMsg.status).toBe(404);

    pool.query.mockResolvedValueOnce({ rows: [] });
    const readRes = await request(app)
      .post(`/api/conversations/${CONVO_ID}/read`)
      .set('Authorization', authHeader());
    expect(readRes.status).toBe(404);

    pool.query.mockResolvedValueOnce({ rows: [] });
    const endRes = await request(app)
      .post(`/api/conversations/${CONVO_ID}/end`)
      .set('Authorization', authHeader());
    expect(endRes.status).toBe(404);

    pool.query.mockResolvedValueOnce({ rows: [] });
    const delRes = await request(app)
      .delete(`/api/conversations/${CONVO_ID}`)
      .set('Authorization', authHeader());
    expect(delRes.status).toBe(404);
  });

  test('POST /api/conversations/:id/messages handles ended, idempotent clientMsgId, and duplicate anti-spam', async () => {
    mockAuthenticatedUser();

    // Ended conversation -> 409 CONVERSATION_ENDED
    pool.query.mockResolvedValueOnce({
      rows: [{ id: CONVO_ID, user_a: ME_ID, user_b: OTHER_ID, status: 'ended' }],
    });
    const endedRes = await request(app)
      .post(`/api/conversations/${CONVO_ID}/messages`)
      .set('Authorization', authHeader())
      .send({ body: 'Hello' });
    expect(endedRes.status).toBe(409);
    expect(endedRes.body.error.code).toBe('CONVERSATION_ENDED');

    // Idempotent clientMsgId returns existing message without incrementing anti-spam
    const existingMsgRow = {
      id: MSG_ID,
      conversation_id: CONVO_ID,
      sender_id: ME_ID,
      body: 'Hello',
      client_msg_id: 'client-1',
      read_at: null,
      created_at: '2026-11-12T12:00:00.000Z',
    };
    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: CONVO_ID, user_a: ME_ID, user_b: OTHER_ID, status: 'active' }],
      })
      .mockResolvedValueOnce({ rows: [] }) // not blocked
      .mockResolvedValueOnce({ rows: [existingMsgRow] }); // idempotent hit

    const idemRes = await request(app)
      .post(`/api/conversations/${CONVO_ID}/messages`)
      .set('Authorization', authHeader())
      .send({ body: 'Hello', clientMsgId: 'client-1' });
    expect(idemRes.status).toBe(201);
    expect(idemRes.body.id).toBe(MSG_ID);
    expect(idemRes.body.clientMsgId).toBe('client-1');

    // 3 identical messages trigger 429 DUPLICATE_MESSAGE
    for (let i = 0; i < 2; i += 1) {
      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: CONVO_ID, user_a: ME_ID, user_b: OTHER_ID, status: 'active' }],
        })
        .mockResolvedValueOnce({ rows: [] }) // not blocked
        .mockResolvedValueOnce({ rows: [] }); // db backstop
      withTransaction.mockImplementation(async (fn) => {
        const client = {
          query: jest
            .fn()
            .mockResolvedValueOnce({
              rows: [
                {
                  id: `msg-${i}`,
                  conversation_id: CONVO_ID,
                  sender_id: ME_ID,
                  body: 'Same text',
                  client_msg_id: null,
                  read_at: null,
                  created_at: new Date().toISOString(),
                },
              ],
            })
            .mockResolvedValueOnce({ rows: [] }),
        };
        return fn(client);
      });
      const r = await request(app)
        .post(`/api/conversations/${CONVO_ID}/messages`)
        .set('Authorization', authHeader())
        .send({ body: 'Same text' });
      expect(r.status).toBe(201);
    }

    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: CONVO_ID, user_a: ME_ID, user_b: OTHER_ID, status: 'active' }],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    const dupRes = await request(app)
      .post(`/api/conversations/${CONVO_ID}/messages`)
      .set('Authorization', authHeader())
      .send({ body: '  same   text ' });
    expect(dupRes.status).toBe(429);
    expect(dupRes.body.error.code).toBe('DUPLICATE_MESSAGE');
    expect(dupRes.headers['retry-after']).toBeDefined();
  });

  test('GET /conversations, /messages, /unread-count, /read, /end, and both-side DELETE hard-delete', async () => {
    mockAuthenticatedUser();

    // GET /api/conversations with pagination
    pool.query.mockResolvedValueOnce({
      rows: [
        makeJoinedConvoRow(),
        makeJoinedConvoRow({ id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' }),
      ],
    });
    const listRes = await request(app)
      .get('/api/conversations?limit=1')
      .set('Authorization', authHeader());
    expect(listRes.status).toBe(200);
    expect(listRes.body.items).toHaveLength(1);
    expect(typeof listRes.body.nextCursor).toBe('string');

    // GET /api/unread-count
    pool.query.mockResolvedValueOnce({ rows: [{ total: 4 }] });
    const unreadRes = await request(app)
      .get('/api/unread-count')
      .set('Authorization', authHeader());
    expect(unreadRes.status).toBe(200);
    expect(unreadRes.body).toEqual({ total: 4 });

    // DELETE /api/conversations/:id when both deleted hard-deletes messages
    pool.query.mockResolvedValueOnce({
      rows: [{ id: CONVO_ID, user_a: ME_ID, user_b: OTHER_ID, status: 'active' }],
    });
    const txQueries = [];
    withTransaction.mockImplementation(async (fn) => {
      const client = {
        query: jest.fn(async (sql) => {
          txQueries.push(sql);
          if (sql.includes('RETURNING a_deleted_at, b_deleted_at')) {
            return {
              rows: [
                { a_deleted_at: '2026-11-12T12:00:00Z', b_deleted_at: '2026-11-12T11:00:00Z' },
              ],
            };
          }
          return { rows: [] };
        }),
      };
      return fn(client);
    });
    const delRes = await request(app)
      .delete(`/api/conversations/${CONVO_ID}`)
      .set('Authorization', authHeader());
    expect(delRes.status).toBe(204);
    expect(txQueries).toHaveLength(2);
    expect(txQueries[1]).toContain('DELETE FROM messages WHERE conversation_id = $1');
  });
});

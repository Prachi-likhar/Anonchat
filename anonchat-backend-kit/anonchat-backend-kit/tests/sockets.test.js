const http = require('http');
const { io: ioClient } = require('socket.io-client');
const request = require('supertest');

jest.mock('../src/db/pool', () => ({
  pool: { query: jest.fn(), end: jest.fn() },
  query: jest.fn(),
  withTransaction: jest.fn(),
  closePool: jest.fn(),
}));

const app = require('../src/app');
const { pool, withTransaction } = require('../src/db/pool');
const { initSockets, closeSockets } = require('../src/sockets');
const { emitForceLogout } = require('../src/sockets/emitter');
const { clearTypingThrottle } = require('../src/sockets/handlers');
const tokenService = require('../src/services/tokenService');
const presenceService = require('../src/services/presenceService');
const antiSpam = require('../src/services/antiSpam');
const { clearAuthCache } = require('../src/middleware/auth');

const ALICE_ID = '11111111-1111-4111-8111-111111111111';
const BOB_ID = '22222222-2222-4222-8222-222222222222';
const CONVO_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function waitForEvent(socket, event, timeoutMs = 3000, label = event) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out waiting for event "${label}"`));
    }, timeoutMs);
    socket.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

function connectSocket(baseUrl, token) {
  return new Promise((resolve, reject) => {
    const client = ioClient(baseUrl, {
      path: '/socket.io',
      transports: ['websocket'],
      auth: token ? { token } : {},
      reconnection: false,
    });
    client.once('connect', () => resolve(client));
    client.once('connect_error', (err) => {
      client.close();
      reject(err);
    });
  });
}

describe('Real-time Socket.IO', () => {
  let httpServer;
  let baseUrl;
  const openClients = [];

  beforeAll(async () => {
    httpServer = http.createServer(app);
    initSockets(httpServer);
    await new Promise((resolve) => {
      httpServer.listen(0, '127.0.0.1', () => {
        const { port } = httpServer.address();
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await closeSockets();
    await new Promise((resolve) => httpServer.close(resolve));
  });

  beforeEach(() => {
    clearAuthCache();
    presenceService.clearPresence();
    antiSpam.clearAntiSpam();
    clearTypingThrottle();
    jest.clearAllMocks();
  });

  afterEach(() => {
    while (openClients.length > 0) {
      const c = openClients.pop();
      if (c && c.connected) {
        c.disconnect();
      } else if (c) {
        c.close();
      }
    }
  });

  function mockUserStatus(userId, status = 'active') {
    return {
      rows: [
        {
          id: userId,
          role: 'user',
          status,
          suspended_until: null,
          status_reason: null,
          email_verified_at: '2026-11-12T10:00:00.000Z',
        },
      ],
    };
  }

  test('rejects unauthenticated and banned socket connections', async () => {
    await expect(connectSocket(baseUrl, null)).rejects.toThrow('UNAUTHENTICATED');

    const bannedToken = tokenService.signAccessToken({ userId: BOB_ID, role: 'user' });
    pool.query.mockResolvedValueOnce(mockUserStatus(BOB_ID, 'banned'));
    await expect(connectSocket(baseUrl, bannedToken)).rejects.toThrow('ACCOUNT_BANNED');
  });

  test('relays presence, typing, message:new, message:read, conversation:ended, and force-logout', async () => {
    const aliceToken = tokenService.signAccessToken({ userId: ALICE_ID, role: 'user' });
    const bobToken = tokenService.signAccessToken({ userId: BOB_ID, role: 'user' });

    // Alice connects (peer lookup returns Bob)
    pool.query.mockImplementation(async (sql, params) => {
      if (sql.includes('FROM users') && params?.[0] === ALICE_ID) {
        return mockUserStatus(ALICE_ID);
      }
      if (sql.includes('FROM users') && params?.[0] === BOB_ID) {
        return mockUserStatus(BOB_ID);
      }
      if (sql.includes('AS peer_id')) {
        return { rows: params[0] === ALICE_ID ? [{ peer_id: BOB_ID }] : [{ peer_id: ALICE_ID }] };
      }
      if (sql.includes('FROM conversations c') && sql.includes("c.status = 'active'")) {
        return { rows: [{ user_a: ALICE_ID, user_b: BOB_ID }] };
      }
      return { rows: [] };
    });

    const aliceSocket = await connectSocket(baseUrl, aliceToken);
    openClients.push(aliceSocket);

    // Bob connects -> Alice receives presence: { memberId: BOB_ID, isOnline: true }
    const presenceOnlinePromise = waitForEvent(aliceSocket, 'presence', 3000, 'presence:online');
    const bobSocket = await connectSocket(baseUrl, bobToken);
    openClients.push(bobSocket);

    const onlineEvent = await presenceOnlinePromise;
    expect(onlineEvent).toEqual({ memberId: BOB_ID, isOnline: true });

    // Typing start & stop from Alice -> Bob receives typing events
    const typingStartPromise = waitForEvent(bobSocket, 'typing');
    aliceSocket.emit('typing:start', { conversationId: CONVO_ID });
    expect(await typingStartPromise).toEqual({ conversationId: CONVO_ID, isTyping: true });

    const typingStopPromise = waitForEvent(bobSocket, 'typing');
    aliceSocket.emit('typing:stop', { conversationId: CONVO_ID });
    expect(await typingStopPromise).toEqual({ conversationId: CONVO_ID, isTyping: false });

    // Blocked / non-participant typing is NOT relayed
    pool.query.mockImplementationOnce(async () => ({ rows: [] }));
    let unexpectedTyping = false;
    bobSocket.once('typing', () => {
      unexpectedTyping = true;
    });
    aliceSocket.emit('typing:start', { conversationId: CONVO_ID });
    await new Promise((r) => setTimeout(r, 80));
    expect(unexpectedTyping).toBe(false);

    // REST POST /messages -> emits message:new to Bob (mine: false) and Alice (mine: true)
    const msgCreatedAt = '2026-11-12T13:00:00.000Z';
    const convoRowFor = (otherId, unread) => ({
      id: CONVO_ID,
      user_a: ALICE_ID,
      user_b: BOB_ID,
      initiated_by: ALICE_ID,
      status: 'active',
      ended_by: null,
      last_message_at: msgCreatedAt,
      created_at: '2026-11-12T12:00:00.000Z',
      other_id: otherId,
      other_anon_username: otherId === BOB_ID ? 'Anonymous_200' : 'Anonymous_100',
      other_gender: 'male',
      other_avatar_color: '#7C3AED',
      last_msg_id: 'msg-1',
      last_msg_body: 'Hello Bob',
      last_msg_created_at: msgCreatedAt,
      last_msg_sender_id: ALICE_ID,
      blocked_by_me: false,
      unread_count: unread,
    });

    pool.query.mockImplementation(async (sql, params) => {
      if (sql.includes('AS peer_id')) {
        return { rows: [{ peer_id: ALICE_ID }] };
      }
      if (sql.includes('FROM conversations') && sql.includes('a_deleted_at IS NULL')) {
        if (sql.includes('LEFT JOIN LATERAL')) {
          return {
            rows: [params[0] === ALICE_ID ? convoRowFor(BOB_ID, 0) : convoRowFor(ALICE_ID, 1)],
          };
        }
        return { rows: [{ id: CONVO_ID, user_a: ALICE_ID, user_b: BOB_ID, status: 'active' }] };
      }
      return { rows: [] };
    });

    withTransaction.mockImplementation(async (fn) => {
      const client = {
        query: jest
          .fn()
          .mockResolvedValueOnce({
            rows: [
              {
                id: 'msg-1',
                conversation_id: CONVO_ID,
                sender_id: ALICE_ID,
                body: 'Hello Bob',
                client_msg_id: null,
                read_at: null,
                created_at: msgCreatedAt,
              },
            ],
          })
          .mockResolvedValueOnce({ rows: [] }),
      };
      return fn(client);
    });

    const bobMsgPromise = waitForEvent(bobSocket, 'message:new');
    const aliceMsgPromise = waitForEvent(aliceSocket, 'message:new');

    const sendRes = await request(app)
      .post(`/api/conversations/${CONVO_ID}/messages`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ body: 'Hello Bob' });
    expect(sendRes.status).toBe(201);

    const bobPayload = await bobMsgPromise;
    const alicePayload = await aliceMsgPromise;
    expect(bobPayload.message.mine).toBe(false);
    expect(bobPayload.message.body).toBe('Hello Bob');
    expect(alicePayload.message.mine).toBe(true);

    // REST POST /read -> emits message:read to Alice
    withTransaction.mockImplementation(async (fn) =>
      fn({ query: jest.fn().mockResolvedValue({ rows: [] }) }),
    );
    const aliceReadPromise = waitForEvent(aliceSocket, 'message:read');
    const readRes = await request(app)
      .post(`/api/conversations/${CONVO_ID}/read`)
      .set('Authorization', `Bearer ${bobToken}`);
    expect(readRes.status).toBe(204);
    const readEvent = await aliceReadPromise;
    expect(readEvent.conversationId).toBe(CONVO_ID);
    expect(typeof readEvent.readAt).toBe('string');

    // REST POST /end -> emits conversation:ended to both
    const bobEndedPromise = waitForEvent(bobSocket, 'conversation:ended');
    const endRes = await request(app)
      .post(`/api/conversations/${CONVO_ID}/end`)
      .set('Authorization', `Bearer ${aliceToken}`);
    expect(endRes.status).toBe(204);
    expect(await bobEndedPromise).toEqual({ conversationId: CONVO_ID });

    // Disconnect Bob -> Alice receives offline presence
    const presenceOfflinePromise = waitForEvent(aliceSocket, 'presence', 3000, 'presence:offline');
    bobSocket.disconnect();
    expect(await presenceOfflinePromise).toEqual({ memberId: BOB_ID, isOnline: false });

    // Force-logout disconnects Alice
    const forceLogoutPromise = waitForEvent(aliceSocket, 'force-logout');
    const disconnectPromise = waitForEvent(aliceSocket, 'disconnect');
    emitForceLogout({ userId: ALICE_ID, reason: 'suspended' });
    expect(await forceLogoutPromise).toEqual({ reason: 'suspended' });
    await disconnectPromise;
    expect(aliceSocket.connected).toBe(false);
  });
});

const antiSpam = require('../src/services/antiSpam');

describe('antiSpam service', () => {
  beforeEach(() => {
    antiSpam.clearAntiSpam();
  });

  test('enforces 5 messages / 10s burst and 20 messages / 60s limit', () => {
    const t0 = 1_700_000_000_000;
    for (let i = 0; i < 5; i += 1) {
      antiSpam.checkMessageRateLimit('u1', t0 + i * 100);
      antiSpam.recordMessageSent({
        userId: 'u1',
        conversationId: 'c1',
        body: `msg-${i}`,
        now: t0 + i * 100,
      });
    }

    expect(() => antiSpam.checkMessageRateLimit('u1', t0 + 1000)).toThrow(
      expect.objectContaining({ statusCode: 429, code: 'RATE_LIMITED' }),
    );

    // Space 20 messages across 50 seconds (4 every 11s) -> 21st within 60s fails
    antiSpam.clearAntiSpam();
    for (let i = 0; i < 20; i += 1) {
      const ts = t0 + Math.floor(i / 4) * 11_000 + (i % 4) * 100;
      antiSpam.checkMessageRateLimit('u2', ts);
      antiSpam.recordMessageSent({ userId: 'u2', conversationId: 'c1', body: `m-${i}`, now: ts });
    }

    expect(() => antiSpam.checkMessageRateLimit('u2', t0 + 55_000)).toThrow(
      expect.objectContaining({ statusCode: 429, code: 'RATE_LIMITED' }),
    );
  });

  test('enforces 10 new conversations per hour', () => {
    const t0 = 1_700_000_000_000;
    for (let i = 0; i < 10; i += 1) {
      antiSpam.checkNewConversationRateLimit('u1', t0 + i * 1000);
      antiSpam.recordConversationCreated('u1', t0 + i * 1000);
    }

    expect(() => antiSpam.checkNewConversationRateLimit('u1', t0 + 20_000)).toThrow(
      expect.objectContaining({ statusCode: 429, code: 'RATE_LIMITED' }),
    );
  });

  test('detects 3rd identical normalized body in 60s as DUPLICATE_MESSAGE', async () => {
    const t0 = 1_700_000_000_000;
    const db = { query: jest.fn().mockResolvedValue({ rows: [] }) };

    await antiSpam.checkDuplicateMessage({
      userId: 'u1',
      conversationId: 'c1',
      body: '  Hello   World ',
      db,
      now: t0,
    });
    antiSpam.recordMessageSent({
      userId: 'u1',
      conversationId: 'c1',
      body: 'Hello World',
      now: t0,
    });

    await antiSpam.checkDuplicateMessage({
      userId: 'u1',
      conversationId: 'c1',
      body: 'hello world',
      db,
      now: t0 + 1000,
    });
    antiSpam.recordMessageSent({
      userId: 'u1',
      conversationId: 'c1',
      body: 'hello world',
      now: t0 + 1000,
    });

    await expect(
      antiSpam.checkDuplicateMessage({
        userId: 'u1',
        conversationId: 'c1',
        body: 'HELLO   world',
        db,
        now: t0 + 2000,
      }),
    ).rejects.toMatchObject({ statusCode: 429, code: 'DUPLICATE_MESSAGE' });
  });
});

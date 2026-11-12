const presenceService = require('../src/services/presenceService');
const { escapeLike, encodeCursor, decodeCursor, slicePage } = require('../src/utils/pagination');
const { toPublicMember } = require('../src/modules/users/users.serializer');

describe('toPublicMember privacy guarantee', () => {
  test('returns EXACT PublicMember keys and strips all private fields', () => {
    const dirtyRow = {
      id: '11111111-1111-4111-8111-111111111111',
      anon_username: 'Anonymous_4821',
      gender: 'male',
      avatar_color: '#7C3AED',
      full_name: 'Secret Real Name',
      email: 'secret@example.com',
      password_hash: '$2b$12$secret',
      last_seen_at: '2026-11-12T10:00:00.000Z',
      created_at: '2026-11-12T09:00:00.000Z',
      status_reason: 'note',
      role: 'user',
    };

    const pub = toPublicMember(dirtyRow, { isOnline: true, blockedByMe: false });
    expect(Object.keys(pub).sort()).toEqual([
      'anonUsername',
      'avatarColor',
      'blockedByMe',
      'gender',
      'id',
      'isOnline',
    ]);
    expect(pub).toEqual({
      id: '11111111-1111-4111-8111-111111111111',
      anonUsername: 'Anonymous_4821',
      gender: 'male',
      avatarColor: '#7C3AED',
      isOnline: true,
      blockedByMe: false,
    });
  });
});

describe('presenceService multi-device tracking', () => {
  beforeEach(() => {
    presenceService.clearPresence();
  });

  test('tracks connection count per user', () => {
    expect(presenceService.isOnline('u1')).toBe(false);

    expect(presenceService.addConnection('u1')).toEqual({ becameOnline: true, count: 1 });
    expect(presenceService.isOnline('u1')).toBe(true);
    expect(presenceService.addConnection('u1')).toEqual({ becameOnline: false, count: 2 });
    expect(presenceService.getOnlineUserIds()).toEqual(['u1']);

    expect(presenceService.removeConnection('u1')).toEqual({ becameOffline: false, count: 1 });
    expect(presenceService.isOnline('u1')).toBe(true);

    expect(presenceService.removeConnection('u1')).toEqual({ becameOffline: true, count: 0 });
    expect(presenceService.isOnline('u1')).toBe(false);
    expect(presenceService.getOnlineUserIds()).toEqual([]);
  });
});

describe('pagination helpers', () => {
  test('escapeLike escapes %, _, and backslash', () => {
    expect(escapeLike('100%_test\\x')).toBe('100\\%\\_test\\\\x');
  });

  test('encodeCursor and decodeCursor round-trip and reject invalid cursors', () => {
    const encoded = encodeCursor({ anonUsername: 'Anonymous_100', id: 'abc' });
    expect(decodeCursor(encoded)).toEqual({ anonUsername: 'Anonymous_100', id: 'abc' });
    expect(decodeCursor(undefined)).toBeNull();
    expect(() => decodeCursor('not-valid-json!')).toThrow(/Invalid pagination cursor/);
  });

  test('slicePage builds nextCursor only when more rows exist', () => {
    const rows = [
      { id: '1', anon_username: 'A' },
      { id: '2', anon_username: 'B' },
      { id: '3', anon_username: 'C' },
    ];
    const page1 = slicePage(rows, 2, (r) => ({ id: r.id }));
    expect(page1.rows).toHaveLength(2);
    expect(decodeCursor(page1.nextCursor)).toEqual({ id: '2' });

    const page2 = slicePage(rows.slice(0, 2), 2, (r) => ({ id: r.id }));
    expect(page2.rows).toHaveLength(2);
    expect(page2.nextCursor).toBeNull();
  });
});

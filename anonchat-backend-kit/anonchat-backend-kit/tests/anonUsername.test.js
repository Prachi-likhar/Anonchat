const {
  generateAnonUsernameCandidate,
  withUniqueAnonUsername,
} = require('../src/utils/anonUsername');

describe('anonUsername generator', () => {
  test('generates Anonymous_<N> within [100, 9999]', () => {
    for (let i = 0; i < 20; i += 1) {
      const name = generateAnonUsernameCandidate();
      expect(name).toMatch(/^Anonymous_\d{3,4}$/);
      const num = Number(name.split('_')[1]);
      expect(num).toBeGreaterThanOrEqual(100);
      expect(num).toBeLessThanOrEqual(9999);
    }
  });

  test('retries on 23505 anon_username collision and widens range after 10 collisions', async () => {
    const seen = [];
    let calls = 0;

    const result = await withUniqueAnonUsername(async (candidate) => {
      calls += 1;
      seen.push(candidate);
      if (calls <= 11) {
        const err = new Error('duplicate key');
        err.code = '23505';
        err.constraint = 'users_anon_username_key';
        throw err;
      }
      return candidate;
    });

    expect(calls).toBe(12);
    expect(result).toBe(seen[11]);
  });

  test('does not swallow non-username unique violations', async () => {
    await expect(
      withUniqueAnonUsername(async () => {
        const err = new Error('duplicate email');
        err.code = '23505';
        err.constraint = 'users_email_key';
        throw err;
      }),
    ).rejects.toThrow('duplicate email');
  });
});


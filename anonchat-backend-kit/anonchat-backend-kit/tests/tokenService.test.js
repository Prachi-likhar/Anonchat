const tokenService = require('../src/services/tokenService');

describe('tokenService', () => {
  test('signAccessToken and verifyAccessToken round-trip HS256 payload', () => {
    const token = tokenService.signAccessToken({
      userId: '11111111-1111-4111-8111-111111111111',
      role: 'user',
    });
    const decoded = tokenService.verifyAccessToken(token);
    expect(decoded.sub).toBe('11111111-1111-4111-8111-111111111111');
    expect(decoded.role).toBe('user');
  });

  test('rotateRefreshToken rotates valid token in same family', async () => {
    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'rt-old',
              user_id: 'user-1',
              family_id: 'fam-1',
              expires_at: new Date(Date.now() + 60000).toISOString(),
              revoked_at: null,
              role: 'user',
              status: 'active',
              suspended_until: null,
              status_reason: null,
              email_verified_at: new Date().toISOString(),
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

    const txRunner = async (fn) => fn(client);

    const res = await tokenService.rotateRefreshToken({
      rawToken: 'raw-secret-token',
      userAgent: 'jest',
      txRunner,
    });

    expect(res.accessToken).toBeTruthy();
    expect(res.refreshToken).toBeTruthy();
    expect(res.refreshToken).not.toBe('raw-secret-token');
    expect(client.query.mock.calls[2][1]).toEqual(['rt-old', 'rt-new']);
  });

  test('rotateRefreshToken revokes entire family on reuse of revoked token', async () => {
    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'rt-reused',
              user_id: 'user-1',
              family_id: 'fam-compromised',
              expires_at: new Date(Date.now() + 60000).toISOString(),
              revoked_at: new Date().toISOString(),
              role: 'user',
              status: 'active',
              suspended_until: null,
              status_reason: null,
              email_verified_at: new Date().toISOString(),
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }),
    };

    const txRunner = async (fn) => fn(client);

    await expect(
      tokenService.rotateRefreshToken({
        rawToken: 'reused-token',
        txRunner,
      }),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: 'UNAUTHENTICATED',
    });

    expect(client.query).toHaveBeenCalledTimes(2);
    expect(client.query.mock.calls[1][0]).toContain('WHERE family_id = $1');
    expect(client.query.mock.calls[1][1]).toEqual(['fam-compromised']);
  });
});

jest.mock('axios', () => ({
  post: jest.fn(),
}));

const axios = require('axios');
const otpService = require('../src/services/otpService');

describe('otpService', () => {
  test('generateOtp produces 6-digit string and hashOtp is deterministic', () => {
    const otp = otpService.generateOtp();
    expect(otp).toMatch(/^\d{6}$/);

    const h1 = otpService.hashOtp('123456', 'user-1');
    const h2 = otpService.hashOtp('123456', 'user-1');
    const h3 = otpService.hashOtp('123456', 'user-2');
    expect(h1).toBe(h2);
    expect(h1).not.toBe(h3);
    expect(h1).not.toContain('123456');
  });

  test('verifyOtp accepts matching code and consumes row', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const codeHash = otpService.hashOtp('654321', userId);
    const db = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'otp-1',
              code_hash: codeHash,
              attempts: 0,
              expires_at: new Date(Date.now() + 60000).toISOString(),
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }),
    };

    const res = await otpService.verifyOtp(db, {
      userId,
      purpose: 'verify_email',
      code: '654321',
    });

    expect(res).toEqual({ valid: true, otpId: 'otp-1' });
    expect(db.query).toHaveBeenLastCalledWith(
      'UPDATE otp_codes SET consumed_at = now() WHERE id = $1',
      ['otp-1'],
    );
  });

  test('verifyOtp invalidates OTP on 5th wrong attempt', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const codeHash = otpService.hashOtp('654321', userId);
    const db = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'otp-1',
              code_hash: codeHash,
              attempts: 4,
              expires_at: new Date(Date.now() + 60000).toISOString(),
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }),
    };

    const res = await otpService.verifyOtp(db, {
      userId,
      purpose: 'verify_email',
      code: '000000',
    });

    expect(res).toEqual({ valid: false, reason: 'INVALID_OTP', invalidated: true });
    expect(db.query.mock.calls[1][1]).toEqual(['otp-1', 5, true]);
  });

  test('verifyOtp marks expired OTP consumed and rejects', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const codeHash = otpService.hashOtp('654321', userId);
    const db = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'otp-exp',
              code_hash: codeHash,
              attempts: 0,
              expires_at: new Date(Date.now() - 1000).toISOString(),
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }),
    };

    const res = await otpService.verifyOtp(db, {
      userId,
      purpose: 'verify_email',
      code: '654321',
    });

    expect(res).toEqual({ valid: false, reason: 'EXPIRED_OTP', invalidated: true });
  });

  test('issueAndSendOtp deletes OTP row and throws 503 if Apps Script fails', async () => {
    axios.post.mockRejectedValueOnce(new Error('network down'));

    const db = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [] }) // consume previous
        .mockResolvedValueOnce({
          rows: [{ id: 'otp-fail', expires_at: new Date().toISOString() }],
        })
        .mockResolvedValueOnce({ rows: [] }), // delete failed otp
    };

    await expect(
      otpService.issueAndSendOtp({
        db,
        userId: 'user-1',
        email: 'user@example.com',
        purpose: 'verify_email',
        appsScriptUrl: 'https://script.google.com/macros/s/test/exec',
        appsScriptSecret: 'secret',
      }),
    ).rejects.toMatchObject({
      statusCode: 503,
      code: 'EMAIL_SERVICE_UNAVAILABLE',
    });

    expect(db.query).toHaveBeenLastCalledWith('DELETE FROM otp_codes WHERE id = $1', ['otp-fail']);
  });
});

import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  messageSchema,
  passwordSchema,
} from '../lib/validators';

describe('Validation Schemas', () => {
  describe('passwordSchema', () => {
    it('accepts valid password with letter and number', () => {
      const res = passwordSchema.safeParse('Secret123');
      expect(res.success).toBe(true);
    });

    it('rejects passwords shorter than 8 chars', () => {
      const res = passwordSchema.safeParse('Sec1');
      expect(res.success).toBe(false);
    });

    it('rejects passwords with only letters', () => {
      const res = passwordSchema.safeParse('SecretPass');
      expect(res.success).toBe(false);
    });

    it('rejects passwords with only numbers', () => {
      const res = passwordSchema.safeParse('12345678');
      expect(res.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('accepts complete valid registration', () => {
      const res = registerSchema.safeParse({
        fullName: 'Jane Doe',
        email: 'jane@community.org',
        password: 'Password123',
        confirmPassword: 'Password123',
        gender: 'female',
        agreeToRules: true,
      });
      expect(res.success).toBe(true);
    });

    it('rejects mismatched passwords', () => {
      const res = registerSchema.safeParse({
        fullName: 'Jane Doe',
        email: 'jane@community.org',
        password: 'Password123',
        confirmPassword: 'Password999',
        gender: 'female',
        agreeToRules: true,
      });
      expect(res.success).toBe(false);
    });

    it('rejects if privacy rules are not agreed to', () => {
      const res = registerSchema.safeParse({
        fullName: 'Jane Doe',
        email: 'jane@community.org',
        password: 'Password123',
        confirmPassword: 'Password123',
        gender: 'female',
        agreeToRules: false,
      });
      expect(res.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('validates email and password presence', () => {
      expect(loginSchema.safeParse({ email: 'test@example.com', password: 'SecretPassword1' }).success).toBe(true);
      expect(loginSchema.safeParse({ email: 'invalid-email', password: 'SecretPassword1' }).success).toBe(false);
      expect(loginSchema.safeParse({ email: 'test@example.com', password: '' }).success).toBe(false);
    });
  });

  describe('verifyOtpSchema', () => {
    it('accepts 6-digit OTP', () => {
      const res = verifyOtpSchema.safeParse({
        email: 'user@example.com',
        otp: '123456',
      });
      expect(res.success).toBe(true);
    });

    it('rejects OTP with non-digits or wrong length', () => {
      expect(verifyOtpSchema.safeParse({ email: 'user@example.com', otp: '12345' }).success).toBe(false);
      expect(verifyOtpSchema.safeParse({ email: 'user@example.com', otp: 'abcdef' }).success).toBe(false);
    });
  });

  describe('messageSchema', () => {
    it('accepts 1 to 2000 character messages', () => {
      expect(messageSchema.safeParse({ body: 'Hello world' }).success).toBe(true);
    });

    it('rejects empty or whitespace-only message', () => {
      expect(messageSchema.safeParse({ body: '   ' }).success).toBe(false);
    });

    it('rejects message exceeding 2000 characters', () => {
      const longMessage = 'a'.repeat(2001);
      expect(messageSchema.safeParse({ body: longMessage }).success).toBe(false);
    });
  });
});

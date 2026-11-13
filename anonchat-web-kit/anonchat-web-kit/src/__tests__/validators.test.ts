import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  messageSchema,
  passwordValidation,
} from '@/lib/validators';

describe('validators', () => {
  describe('passwordValidation', () => {
    it('requires at least 8 characters with at least 1 letter and 1 number', () => {
      expect(passwordValidation.safeParse('short1').success).toBe(false);
      expect(passwordValidation.safeParse('alllettersnodigits').success).toBe(false);
      expect(passwordValidation.safeParse('12345678').success).toBe(false);
      expect(passwordValidation.safeParse('ValidPass1').success).toBe(true);
    });
  });

  describe('registerSchema', () => {
    it('accepts valid registration input', () => {
      const valid = {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        gender: 'female',
        agreeToRules: true,
      };
      const result = registerSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects password mismatch', () => {
      const invalid = {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123',
        confirmPassword: 'DifferentPassword123',
        gender: 'female',
        agreeToRules: true,
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects unagreed community rules', () => {
      const invalid = {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        gender: 'female',
        agreeToRules: false,
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('validates email and password', () => {
      expect(loginSchema.safeParse({ email: 'test@example.com', password: 'pass' }).success).toBe(
        true,
      );
      expect(loginSchema.safeParse({ email: 'notanemail', password: 'pass' }).success).toBe(false);
    });
  });

  describe('verifyEmailSchema', () => {
    it('requires exactly 6 digits', () => {
      expect(verifyEmailSchema.safeParse({ otp: '123456' }).success).toBe(true);
      expect(verifyEmailSchema.safeParse({ otp: '12345' }).success).toBe(false);
      expect(verifyEmailSchema.safeParse({ otp: 'abcdef' }).success).toBe(false);
    });
  });

  describe('messageSchema', () => {
    it('accepts trimmed non-empty message up to 2000 chars', () => {
      expect(messageSchema.safeParse({ body: 'Hello world' }).success).toBe(true);
      expect(messageSchema.safeParse({ body: '   ' }).success).toBe(false);
      expect(messageSchema.safeParse({ body: 'a'.repeat(2001) }).success).toBe(false);
    });
  });
});

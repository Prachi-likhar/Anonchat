import { describe, it, expect } from 'vitest';
import { getErrorMessage, ERROR_MESSAGES } from '@/lib/errors';

describe('error mapper', () => {
  it('returns mapped string for recognized error codes', () => {
    const fakeAxiosError = {
      isAxiosError: true,
      response: {
        data: {
          error: {
            code: 'RATE_LIMITED',
          },
        },
      },
    };

    expect(getErrorMessage(fakeAxiosError)).toBe(ERROR_MESSAGES.RATE_LIMITED);
  });

  it('returns custom backend message when provided', () => {
    const fakeAxiosError = {
      isAxiosError: true,
      response: {
        data: {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email is already taken',
          },
        },
      },
    };

    expect(getErrorMessage(fakeAxiosError)).toBe('Email is already taken');
  });

  it('handles standard Error instances', () => {
    expect(getErrorMessage(new Error('Custom error'))).toBe('Custom error');
  });

  it('falls back to default message for unknown inputs', () => {
    expect(getErrorMessage(null)).toBe('An unexpected error occurred. Please try again.');
  });
});

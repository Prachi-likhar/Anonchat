import { describe, it, expect } from 'vitest';
import { getAnonInitials, maskEmail } from '@/lib/format';

describe('format utilities', () => {
  describe('getAnonInitials', () => {
    it('extracts leading 2 digits from Anonymous_<N>', () => {
      expect(getAnonInitials('Anonymous_4821')).toBe('48');
      expect(getAnonInitials('Anonymous_9')).toBe('9');
      expect(getAnonInitials('Anonymous_98765')).toBe('98');
    });

    it('handles unexpected formats gracefully', () => {
      expect(getAnonInitials('Admin')).toBe('AD');
      expect(getAnonInitials('')).toBe('??');
    });
  });

  describe('maskEmail', () => {
    it('masks email for profile privacy', () => {
      expect(maskEmail('alexander@gmail.com')).toBe('a***r@gmail.com');
      expect(maskEmail('me@test.com')).toBe('m*@test.com');
      expect(maskEmail('invalid')).toBe('******');
    });
  });
});

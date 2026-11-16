import { maskEmail, formatTime, formatDateSeparator } from '../lib/format';

describe('format utilities', () => {
  describe('maskEmail', () => {
    it('masks middle characters of email local-part', () => {
      const masked = maskEmail('alexander@example.com');
      expect(masked).toBe('a*******r@example.com');
    });

    it('handles short usernames safely', () => {
      const masked = maskEmail('al@example.com');
      expect(masked).toBe('a*@example.com');
    });

    it('handles invalid input gracefully', () => {
      expect(maskEmail('')).toBe('***@***.***');
    });
  });

  describe('formatTime', () => {
    it('formats ISO time string to HH:mm', () => {
      const time = formatTime('2026-11-16T14:30:00Z');
      expect(time).toMatch(/^\d{2}:\d{2}$/);
    });

    it('handles invalid time gracefully', () => {
      expect(formatTime('invalid-date')).toBe('');
    });
  });

  describe('formatDateSeparator', () => {
    it('returns Today for current date', () => {
      const today = new Date().toISOString();
      expect(formatDateSeparator(today)).toBe('Today');
    });
  });
});

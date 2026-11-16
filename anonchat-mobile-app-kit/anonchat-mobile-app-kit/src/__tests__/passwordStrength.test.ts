import { evaluatePasswordStrength } from '../lib/passwordStrength';

describe('evaluatePasswordStrength', () => {
  it('returns Weak for empty or short strings', () => {
    expect(evaluatePasswordStrength('').label).toBe('Weak');
    expect(evaluatePasswordStrength('short').label).toBe('Weak');
  });

  it('evaluates moderate passwords as Fair or Good', () => {
    const fair = evaluatePasswordStrength('lowercase12');
    expect(['Fair', 'Good']).toContain(fair.label);

    const good = evaluatePasswordStrength('LongerPassword123');
    expect(['Good', 'Strong']).toContain(good.label);
  });

  it('evaluates comprehensive passwords as Strong', () => {
    const strong = evaluatePasswordStrength('VerySecureP@ssw0rd!2026');
    expect(strong.label).toBe('Strong');
    expect(strong.score).toBe(4);
    expect(strong.color).toBe('#22C55E');
  });
});

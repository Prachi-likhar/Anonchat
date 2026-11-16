export interface PasswordStrengthResult {
  score: number; // 0 - 4
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return { score: 0, label: 'Weak', color: '#EF4444' };
  }

  let points = 0;
  if (password.length >= 8) points++;
  if (password.length >= 12) points++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) points++;
  if (/[0-9]/.test(password)) points++;
  if (/[^A-Za-z0-9]/.test(password)) points++;

  if (points <= 1) {
    return { score: 1, label: 'Weak', color: '#EF4444' };
  }
  if (points === 2) {
    return { score: 2, label: 'Fair', color: '#F59E0B' };
  }
  if (points === 3 || points === 4) {
    return { score: 3, label: 'Good', color: '#3B82F6' };
  }
  return { score: 4, label: 'Strong', color: '#22C55E' };
}

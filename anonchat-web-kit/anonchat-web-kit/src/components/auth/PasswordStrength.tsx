import React from 'react';
import { cn } from '@/lib/cn';
import { calculatePasswordStrength } from '@/lib/validators';

export interface PasswordStrengthProps {
  password?: string;
  className?: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password = '', className }) => {
  const { score, label, color } = calculatePasswordStrength(password);

  if (!password) return null;

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-all duration-200',
              score >= index ? color : 'bg-surface-2 border border-border/40',
            )}
          />
        ))}
      </div>
      <div className="flex justify-between items-center text-[11px]">
        <span className="text-muted">Strength:</span>
        <span
          className={cn(
            'font-semibold',
            score === 1 && 'text-danger',
            score === 2 && 'text-amber-500',
            score === 3 && 'text-sky-500',
            score === 4 && 'text-online',
          )}
        >
          {label}
        </span>
      </div>
    </div>
  );
};

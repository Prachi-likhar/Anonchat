import React from 'react';
import { cn } from '@/lib/cn';
import type { Gender } from '@/types/api';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'neutral' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-surface-2 text-text border border-border',
    primary: 'bg-primary/10 text-primary border border-primary/20',
    success: 'bg-online/10 text-online border border-online/20',
    danger: 'bg-danger/10 text-danger border border-danger/20',
    warning: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    neutral: 'bg-muted/10 text-muted border border-muted/20',
    outline: 'bg-transparent text-text border border-border',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md gap-1',
    md: 'text-xs px-2.5 py-1 rounded-lg gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium select-none',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export interface GenderBadgeProps {
  gender: Gender;
  size?: 'sm' | 'md';
  className?: string;
}

export const GenderBadge: React.FC<GenderBadgeProps> = ({ gender, size = 'md', className }) => {
  const isMale = gender === 'male';

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-lg select-none',
        size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5',
        isMale
          ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
        className,
      )}
    >
      <span className="font-semibold">{isMale ? '♂' : '♀'}</span>
      <span className="capitalize">{gender}</span>
    </span>
  );
};

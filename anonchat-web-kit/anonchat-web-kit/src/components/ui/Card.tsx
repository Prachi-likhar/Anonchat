import React from 'react';
import { cn } from '@/lib/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass';
  isHoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  isHoverable = false,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-surface border border-border',
    elevated: 'bg-surface border border-border shadow-md shadow-black/5',
    glass: 'bg-surface/80 backdrop-blur-md border border-border/80',
  };

  return (
    <div
      className={cn(
        'rounded-2xl p-6 transition-all duration-200',
        variantStyles[variant],
        isHoverable &&
          'hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

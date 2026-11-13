import React from 'react';
import { cn } from '@/lib/cn';
import { Button, type ButtonProps } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: ButtonProps['variant'];
    icon?: React.ReactNode;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border border-dashed border-border bg-surface/50',
        className,
      )}
    >
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-primary mb-4 border border-border shadow-sm">
          {icon}
        </div>
      )}

      <h3 className="text-base font-semibold text-text">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted max-w-sm">{description}</p>}

      {action && (
        <div className="mt-5">
          <Button
            variant={action.variant || 'primary'}
            size="sm"
            onClick={action.onClick}
            leftIcon={action.icon}
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
};

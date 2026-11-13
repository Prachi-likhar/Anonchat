import React from 'react';
import { cn } from '@/lib/cn';
import { getAnonInitials } from '@/lib/format';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  anonUsername?: string;
  avatarColor?: string;
  isOnline?: boolean;
  showOnlineStatus?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm font-medium',
  lg: 'w-14 h-14 text-base font-semibold',
  xl: 'w-20 h-20 text-xl font-bold',
};

const dotSizes = {
  xs: 'w-1.5 h-1.5 ring-1',
  sm: 'w-2 h-2 ring-1.5',
  md: 'w-2.5 h-2.5 ring-2',
  lg: 'w-3.5 h-3.5 ring-2',
  xl: 'w-5 h-5 ring-3',
};

export const Avatar: React.FC<AvatarProps> = ({
  anonUsername,
  avatarColor = '#7C3AED',
  isOnline = false,
  showOnlineStatus = false,
  size = 'md',
  className,
  ...props
}) => {
  const initials = getAnonInitials(anonUsername);

  return (
    <div className={cn('relative inline-flex flex-shrink-0 select-none', className)} {...props}>
      <div
        className={cn(
          'flex items-center justify-center rounded-full text-white font-mono shadow-inner',
          sizeClasses[size],
        )}
        style={{ backgroundColor: avatarColor }}
        aria-label={anonUsername || 'Anonymous Member'}
      >
        <span>{initials}</span>
      </div>

      {showOnlineStatus && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-surface transition-colors duration-150',
            dotSizes[size],
            isOnline ? 'bg-online' : 'bg-muted/40',
          )}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};

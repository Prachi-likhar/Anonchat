import React from 'react';
import { View, Text } from 'react-native';
import { User } from 'lucide-react-native';
import { cn } from '../../lib/cn';
import { tokens } from '../../theme/tokens';

export interface AvatarProps {
  color?: string;
  anonUsername?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showOnlineStatus?: boolean;
  isOnline?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  color = tokens.colors.primary.DEFAULT,
  anonUsername,
  size = 'md',
  showOnlineStatus = false,
  isOnline = false,
  className,
}) => {
  const sizeMap = {
    sm: { container: 'w-8 h-8 rounded-full', icon: 16, text: 'text-xs', dot: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5' },
    md: { container: 'w-11 h-11 rounded-full', icon: 20, text: 'text-sm font-semibold', dot: 'w-3 h-3 bottom-0 right-0' },
    lg: { container: 'w-14 h-14 rounded-full', icon: 26, text: 'text-base font-bold', dot: 'w-3.5 h-3.5 bottom-0 right-0' },
    xl: { container: 'w-20 h-20 rounded-full', icon: 36, text: 'text-xl font-bold', dot: 'w-4 h-4 bottom-1 right-1' },
  }[size];

  // Derive initial or number
  const label = anonUsername
    ? anonUsername.replace(/^Anonymous_?/, '').slice(0, 2)
    : '';

  return (
    <View className={cn('relative inline-flex items-center justify-center', className)}>
      <View
        className={cn(sizeMap.container, 'items-center justify-center shadow-sm')}
        style={{ backgroundColor: color }}
      >
        {label ? (
          <Text className={cn(sizeMap.text, 'text-white font-bold')}>{label}</Text>
        ) : (
          <User size={sizeMap.icon} color="#FFFFFF" />
        )}
      </View>

      {showOnlineStatus && (
        <View
          className={cn(
            'absolute rounded-full border-2 border-surface-light dark:border-surface-dark',
            sizeMap.dot,
            isOnline ? 'bg-online' : 'bg-muted-light dark:bg-muted-dark opacity-60'
          )}
        />
      )}
    </View>
  );
};

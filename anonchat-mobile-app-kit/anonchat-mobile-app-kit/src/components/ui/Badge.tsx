import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { cn } from '../../lib/cn';

export interface BadgeProps extends ViewProps {
  label: string | number;
  variant?: 'default' | 'online' | 'danger' | 'warning' | 'info' | 'primary';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
  className,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-surface-2-light dark:bg-surface-2-dark text-muted-light dark:text-muted-dark',
    online: 'bg-green-500/10 text-online border border-green-500/20',
    danger: 'bg-danger/10 text-danger border border-danger/20',
    warning: 'bg-warning/10 text-amber-500 border border-warning/20',
    info: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
    primary: 'bg-primary text-white',
  }[variant];

  const sizeStyles = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
  }[size];

  return (
    <View
      className={cn('inline-flex items-center justify-center rounded-full self-start', variantStyles, className)}
      {...props}
    >
      <Text className={cn('font-medium leading-none', sizeStyles, variantStyles)}>
        {label}
      </Text>
    </View>
  );
};

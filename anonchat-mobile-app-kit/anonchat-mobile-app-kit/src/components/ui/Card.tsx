import React from 'react';
import { View, TouchableOpacity, ViewProps, TouchableOpacityProps } from 'react-native';
import { cn } from '../../lib/cn';

export interface CardProps extends ViewProps {
  onPress?: TouchableOpacityProps['onPress'];
  activeOpacity?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  onPress,
  activeOpacity = 0.7,
  style,
  ...props
}) => {
  const baseClasses =
    'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-4 shadow-sm';

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={activeOpacity}
        className={cn(baseClasses, className)}
        style={style}
        accessibilityRole="button"
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View className={cn(baseClasses, className)} style={style} {...props}>
      {children}
    </View>
  );
};

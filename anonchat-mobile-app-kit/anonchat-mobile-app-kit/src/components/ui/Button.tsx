import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  TouchableOpacityProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { cn } from '../../lib/cn';
import { tokens } from '../../theme/tokens';

export interface ButtonProps extends TouchableOpacityProps {
  title?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
  onPress,
  className,
  style,
  ...props
}) => {
  const handlePress = (e: any) => {
    if (disabled || loading) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {
      // Haptics safe fallback
    }
    onPress?.(e);
  };

  const sizeClasses = {
    sm: 'h-10 px-3 rounded-xl',
    md: 'h-12 px-5 rounded-2xl',
    lg: 'h-14 px-6 rounded-2xl',
  }[size];

  const textSizeClasses = {
    sm: 'text-sm font-semibold',
    md: 'text-base font-semibold',
    lg: 'text-lg font-bold',
  }[size];

  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;

  const content = (
    <View className="flex-row items-center justify-center space-x-2">
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isPrimary || variant === 'danger' ? '#FFFFFF' : tokens.colors.primary.DEFAULT}
        />
      ) : (
        <>
          {icon && <View className="mr-1.5">{icon}</View>}
          {title ? (
            <Text
              className={cn(
                textSizeClasses,
                isPrimary && 'text-white',
                variant === 'secondary' && 'text-content-light dark:text-content-dark',
                variant === 'outline' && 'text-primary dark:text-primary-light',
                variant === 'ghost' && 'text-muted-light dark:text-muted-dark',
                variant === 'danger' && 'text-white',
                isDisabled && 'opacity-60'
              )}
            >
              {title}
            </Text>
          ) : (
            children
          )}
        </>
      )}
    </View>
  );

  if (isPrimary && !isDisabled) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        className={cn(fullWidth ? 'w-full' : 'self-start', className)}
        style={style}
        {...props}
      >
        <LinearGradient
          colors={tokens.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className={cn(sizeClasses, 'items-center justify-center shadow-sm')}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantClasses = {
    primary: 'bg-primary',
    secondary: 'bg-surface-2-light dark:bg-surface-2-dark',
    outline: 'border border-border-light dark:border-border-dark bg-transparent',
    ghost: 'bg-transparent',
    danger: 'bg-danger',
  }[variant];

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className={cn(
        sizeClasses,
        variantClasses,
        fullWidth ? 'w-full' : 'self-start',
        'items-center justify-center',
        isDisabled && 'opacity-50',
        className
      )}
      style={style}
      {...props}
    >
      {content}
    </TouchableOpacity>
  );
};

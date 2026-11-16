import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { cn } from '../../lib/cn';
import { tokens } from '../../theme/tokens';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  showPasswordToggle = false,
  secureTextEntry,
  className,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry ?? false);

  const toggleSecure = () => {
    setIsSecure((prev) => !prev);
  };

  return (
    <View className="w-full mb-4">
      {label && (
        <Text className="text-sm font-medium mb-1.5 text-content-light dark:text-content-dark">
          {label}
        </Text>
      )}

      <View
        className={cn(
          'flex-row items-center h-12 px-3.5 rounded-xl border bg-surface-light dark:bg-surface-dark',
          isFocused
            ? 'border-primary ring-1 ring-primary'
            : error
              ? 'border-danger'
              : 'border-border-light dark:border-border-dark'
        )}
      >
        {leftIcon && <View className="mr-2.5">{leftIcon}</View>}

        <TextInput
          placeholderTextColor="#8E92B0"
          secureTextEntry={showPasswordToggle ? isSecure : secureTextEntry}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            'flex-1 text-base text-content-light dark:text-content-dark py-0 h-full',
            className
          )}
          {...props}
        />

        {showPasswordToggle ? (
          <TouchableOpacity
            onPress={toggleSecure}
            accessibilityRole="button"
            accessibilityLabel={isSecure ? 'Show password' : 'Hide password'}
            className="p-1"
          >
            {isSecure ? (
              <Eye size={20} color={tokens.colors.muted.dark} />
            ) : (
              <EyeOff size={20} color={tokens.colors.primary.DEFAULT} />
            )}
          </TouchableOpacity>
        ) : (
          rightIcon && <View className="ml-2.5">{rightIcon}</View>
        )}
      </View>

      {error ? (
        <Text className="text-xs text-danger mt-1 font-medium">{error}</Text>
      ) : helperText ? (
        <Text className="text-xs text-muted-light dark:text-muted-dark mt-1">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};

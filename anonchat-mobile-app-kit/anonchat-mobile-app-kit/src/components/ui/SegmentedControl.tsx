import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { cn } from '../../lib/cn';

export interface SegmentOption<T extends string> {
  label: string;
  value: T;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
  className,
}: SegmentedControlProps<T>) {
  const handleSelect = (val: T) => {
    if (disabled || val === value) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {
      // Haptics safe fallback
    }
    onChange(val);
  };

  return (
    <View
      className={cn(
        'flex-row p-1 rounded-xl bg-surface-2-light dark:bg-surface-2-dark border border-border-light dark:border-border-dark',
        disabled && 'opacity-50',
        className
      )}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => handleSelect(option.value)}
            disabled={disabled}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            className={cn(
              'flex-1 flex-row items-center justify-center py-2.5 px-3 rounded-lg',
              isSelected
                ? 'bg-surface-light dark:bg-surface-dark shadow-sm'
                : 'bg-transparent'
            )}
          >
            {option.icon && <View className="mr-1.5">{option.icon}</View>}
            <Text
              className={cn(
                'text-sm font-semibold',
                isSelected
                  ? 'text-primary dark:text-primary-light'
                  : 'text-muted-light dark:text-muted-dark'
              )}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

import React from 'react';
import { ScrollView, TouchableOpacity, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { cn } from '../../lib/cn';

export interface FilterChipOption {
  label: string;
  value: string;
  count?: number;
}

export interface FilterChipsProps {
  chips: FilterChipOption[];
  selected: string;
  onSelect: (value: string) => void;
  className?: string;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  chips,
  selected,
  onSelect,
  className,
}) => {
  const handleSelect = (val: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {
      // Haptics safe fallback
    }
    onSelect(val);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className={cn('flex-row py-2', className)}
      contentContainerStyle={{ paddingHorizontal: 4 }}
    >
      {chips.map((chip) => {
        const isSelected = chip.value === selected;
        return (
          <TouchableOpacity
            key={chip.value}
            onPress={() => handleSelect(chip.value)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            className={cn(
              'mr-2 flex-row items-center px-4 py-2 rounded-full border',
              isSelected
                ? 'bg-primary border-primary'
                : 'bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark'
            )}
          >
            <Text
              className={cn(
                'text-sm font-semibold',
                isSelected ? 'text-white' : 'text-content-light dark:text-content-dark'
              )}
            >
              {chip.label}
            </Text>
            {chip.count !== undefined && (
              <View
                className={cn(
                  'ml-1.5 px-1.5 py-0.2 rounded-full',
                  isSelected
                    ? 'bg-white/20'
                    : 'bg-surface-2-light dark:bg-surface-2-dark'
                )}
              >
                <Text
                  className={cn(
                    'text-xs font-bold',
                    isSelected ? 'text-white' : 'text-muted-light dark:text-muted-dark'
                  )}
                >
                  {chip.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

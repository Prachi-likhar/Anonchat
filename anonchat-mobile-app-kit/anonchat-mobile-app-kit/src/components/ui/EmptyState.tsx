import React from 'react';
import { View, Text } from 'react-native';
import { cn } from '../../lib/cn';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onPress: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className,
}) => {
  return (
    <View
      className={cn(
        'items-center justify-center p-8 text-center',
        className
      )}
    >
      {icon && (
        <View className="mb-4 p-4 rounded-full bg-surface-2-light dark:bg-surface-2-dark">
          {icon}
        </View>
      )}
      <Text className="text-lg font-bold text-content-light dark:text-content-dark text-center mb-1.5">
        {title}
      </Text>
      {description && (
        <Text className="text-sm text-muted-light dark:text-muted-dark text-center mb-6 max-w-xs">
          {description}
        </Text>
      )}
      {action && (
        <Button
          title={action.label}
          onPress={action.onPress}
          variant="primary"
          size="md"
          fullWidth={false}
        />
      )}
    </View>
  );
};

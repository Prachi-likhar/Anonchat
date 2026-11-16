import React from 'react';
import { View, Text } from 'react-native';

export default function AdminIndexStub() {
  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark p-4 items-center justify-center">
      <Text className="text-xl font-bold text-content-light dark:text-content-dark mb-2">
        Admin Portal
      </Text>
      <Text className="text-sm text-muted-light dark:text-muted-dark text-center">
        Compact mobile admin dashboard will be implemented in Phase 7.
      </Text>
    </View>
  );
}

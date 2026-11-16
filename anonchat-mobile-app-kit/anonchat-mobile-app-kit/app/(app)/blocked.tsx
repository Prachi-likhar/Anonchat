import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui';

export default function BlockedStub() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark p-4 items-center justify-center">
      <Text className="text-xl font-bold text-content-light dark:text-content-dark mb-2">
        Blocked Members
      </Text>
      <Text className="text-sm text-muted-light dark:text-muted-dark mb-6 text-center">
        Unblock list and controls will be implemented in Phase 3.
      </Text>
      <Button title="Back" variant="secondary" onPress={() => router.back()} />
    </View>
  );
}

import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui';

export default function RegisterStub() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center p-6 bg-background-light dark:bg-background-dark">
      <Text className="text-2xl font-bold text-content-light dark:text-content-dark mb-4">
        Create Anonymous Account
      </Text>
      <Text className="text-sm text-muted-light dark:text-muted-dark mb-6 text-center">
        Registration form will be fully populated in Phase 2.
      </Text>
      <Button title="Back to Welcome" variant="secondary" onPress={() => router.back()} />
    </View>
  );
}

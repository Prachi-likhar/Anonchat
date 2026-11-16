import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../../../src/components/ui';

export default function ChatThreadStub() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark p-4 items-center justify-center">
      <Text className="text-xl font-bold text-content-light dark:text-content-dark mb-2">
        Chat Thread: {id}
      </Text>
      <Text className="text-sm text-muted-light dark:text-muted-dark mb-6 text-center">
        Realtime message thread with snapshot report tools will be implemented in Phase 4.
      </Text>
      <Button title="Back to Chats" variant="secondary" onPress={() => router.back()} />
    </View>
  );
}

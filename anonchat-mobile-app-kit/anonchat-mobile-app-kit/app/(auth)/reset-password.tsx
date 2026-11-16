import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui';

export default function ResetPasswordStub() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center p-6 bg-background-light dark:bg-background-dark">
      <Text className="text-2xl font-bold text-content-light dark:text-content-dark mb-4">
        Reset Password
      </Text>
      <Text className="text-sm text-muted-light dark:text-muted-dark mb-6 text-center">
        Reset password form will be fully populated in Phase 2.
      </Text>
      <Button title="Back to Login" variant="secondary" onPress={() => router.replace('/(auth)/login')} />
    </View>
  );
}

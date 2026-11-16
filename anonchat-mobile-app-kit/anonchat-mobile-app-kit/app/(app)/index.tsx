import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';
import { Card, Avatar } from '../../src/components/ui';

export default function HomeScreen() {
  const { user } = useAuthStore();

  return (
    <ScrollView className="flex-1 bg-background-light dark:bg-background-dark p-4">
      <View className="flex-row items-center justify-between mt-8 mb-6">
        <View>
          <Text className="text-sm text-muted-light dark:text-muted-dark font-medium">
            Signed in as
          </Text>
          <Text className="text-2xl font-bold text-content-light dark:text-content-dark">
            {user?.anonUsername || 'Anonymous'}
          </Text>
        </View>
        <Avatar
          color={user?.avatarColor}
          anonUsername={user?.anonUsername}
          size="md"
        />
      </View>

      <Card className="p-5 mb-4">
        <Text className="text-lg font-bold text-content-light dark:text-content-dark mb-1">
          Welcome to Anonchat
        </Text>
        <Text className="text-sm text-muted-light dark:text-muted-dark leading-relaxed">
          Home dashboard, activity metrics, and suggested members will be populated in Phase 3.
        </Text>
      </Card>
    </ScrollView>
  );
}

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut, Settings as SettingsIcon } from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { Card, Avatar, Button } from '../../src/components/ui';
import { maskEmail } from '../../src/lib/format';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  return (
    <ScrollView className="flex-1 bg-background-light dark:bg-background-dark p-4">
      <View className="items-center mt-10 mb-6">
        <Avatar
          color={user?.avatarColor}
          anonUsername={user?.anonUsername}
          size="xl"
          className="mb-4"
        />
        <Text className="text-2xl font-bold text-content-light dark:text-content-dark">
          {user?.anonUsername || 'Anonymous'}
        </Text>
        <Text className="text-sm text-muted-light dark:text-muted-dark mt-1">
          {user ? maskEmail(user.email) : ''}
        </Text>
      </View>

      <Card className="p-4 mb-4 space-y-3">
        <Button
          title="Settings"
          variant="secondary"
          icon={<SettingsIcon size={18} color="#8E92B0" />}
          onPress={() => router.push('/(app)/settings')}
        />
        <View className="h-2" />
        <Button
          title="Log Out"
          variant="outline"
          icon={<LogOut size={18} color="#EF4444" />}
          onPress={() => logout()}
        />
      </Card>
    </ScrollView>
  );
}

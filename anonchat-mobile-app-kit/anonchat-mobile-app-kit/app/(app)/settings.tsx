import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../src/store/themeStore';
import { SegmentedControl, Button, Card } from '../../src/components/ui';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, setTheme } = useThemeStore();

  return (
    <ScrollView className="flex-1 bg-background-light dark:bg-background-dark p-4">
      <View className="mt-8 mb-6">
        <Text className="text-2xl font-bold text-content-light dark:text-content-dark">
          Settings
        </Text>
      </View>

      <Card className="p-4 mb-4">
        <Text className="text-sm font-semibold text-content-light dark:text-content-dark mb-3">
          Appearance
        </Text>
        <SegmentedControl
          options={[
            { label: 'System', value: 'system' },
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
          ]}
          value={theme}
          onChange={(val) => setTheme(val, true)}
        />
      </Card>

      <Card className="p-4 mb-6">
        <Button
          title="Blocked Users"
          variant="secondary"
          onPress={() => router.push('/(app)/blocked')}
        />
      </Card>

      <Button title="Back" variant="outline" onPress={() => router.back()} />
    </ScrollView>
  );
}

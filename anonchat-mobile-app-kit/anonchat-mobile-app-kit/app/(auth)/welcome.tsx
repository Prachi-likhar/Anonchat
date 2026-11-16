import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldCheck, UserCheck, MessageSquare, Sparkles } from 'lucide-react-native';
import { Button, Card } from '../../src/components/ui';
import { tokens } from '../../src/theme/tokens';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <ScrollView
      className="flex-1 bg-background-light dark:bg-background-dark"
      contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'space-between' }}
    >
      <View className="items-center mt-12">
        <View className="w-20 h-20 rounded-3xl bg-primary items-center justify-center mb-6 shadow-xl shadow-primary/30">
          <MessageSquare size={40} color="#FFFFFF" />
        </View>

        <Text className="text-3xl font-bold text-center text-content-light dark:text-content-dark mb-3">
          Anonchat
        </Text>
        <Text className="text-base text-center text-muted-light dark:text-muted-dark max-w-xs leading-relaxed">
          One-to-one anonymous conversations with verified community members.
        </Text>
      </View>

      <View className="my-8 space-y-3">
        <Card className="flex-row items-center p-3.5 mb-2.5">
          <ShieldCheck size={22} color={tokens.colors.primary.DEFAULT} />
          <View className="ml-3 flex-1">
            <Text className="text-sm font-semibold text-content-light dark:text-content-dark">
              Zero Real-Name Leakage
            </Text>
            <Text className="text-xs text-muted-light dark:text-muted-dark">
              You chat only as a permanent pseudonym like Anonymous_4821.
            </Text>
          </View>
        </Card>

        <Card className="flex-row items-center p-3.5 mb-2.5">
          <UserCheck size={22} color={tokens.colors.online} />
          <View className="ml-3 flex-1">
            <Text className="text-sm font-semibold text-content-light dark:text-content-dark">
              Community Verified
            </Text>
            <Text className="text-xs text-muted-light dark:text-muted-dark">
              Real institutional emails verified via one-time passcodes.
            </Text>
          </View>
        </Card>

        <Card className="flex-row items-center p-3.5">
          <Sparkles size={22} color="#EC4899" />
          <View className="ml-3 flex-1">
            <Text className="text-sm font-semibold text-content-light dark:text-content-dark">
              Snapshot-Only Moderation
            </Text>
            <Text className="text-xs text-muted-light dark:text-muted-dark">
              No surveillance. Admins only see snapshots when a member files a report.
            </Text>
          </View>
        </Card>
      </View>

      <View className="space-y-3 mb-6">
        <Button
          title="Create Anonymous Account"
          onPress={() => router.push('/(auth)/register')}
          size="lg"
        />
        <View className="h-2" />
        <Button
          title="Log In"
          variant="secondary"
          onPress={() => router.push('/(auth)/login')}
          size="lg"
        />
      </View>
    </ScrollView>
  );
}

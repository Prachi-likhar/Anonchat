import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Moon,
  ShieldAlert,
  Users,
  Info,
  LogOut,
  ChevronRight,
  Bell,
} from 'lucide-react-native';
import { useThemeStore } from '../../src/store/themeStore';
import { useAuthStore } from '../../src/store/authStore';
import { Card, SegmentedControl, Button, ConfirmDialog } from '../../src/components/ui';
import { tokens } from '../../src/theme/tokens';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, setTheme } = useThemeStore();
  const { logout } = useAuthStore();

  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [rulesModalVisible, setRulesModalVisible] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setLogoutDialogVisible(false);
      router.replace('/(auth)/welcome');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-background-light dark:bg-background-dark"
      contentContainerStyle={{ padding: 20, paddingTop: 48, paddingBottom: 40 }}
    >
      <View className="flex-row items-center mb-6">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-surface-2-light dark:bg-surface-2-dark mr-3"
        >
          <ArrowLeft size={20} color={tokens.colors.content.dark} />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-content-light dark:text-content-dark">
          Settings
        </Text>
      </View>

      {/* Appearance Section */}
      <Card className="p-4 mb-5 bg-surface-light dark:bg-surface-dark">
        <View className="flex-row items-center mb-3">
          <Moon size={18} color={tokens.colors.primary.DEFAULT} />
          <Text className="text-sm font-bold text-content-light dark:text-content-dark ml-2">
            Appearance
          </Text>
        </View>

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

      {/* Notifications Section */}
      <Card className="p-4 mb-5 bg-surface-light dark:bg-surface-dark">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Bell size={18} color={tokens.colors.primary.DEFAULT} />
            <View className="ml-2.5">
              <Text className="text-sm font-bold text-content-light dark:text-content-dark">
                Message Notifications
              </Text>
              <Text className="text-xs text-muted-light dark:text-muted-dark">
                Privacy-preserving generic alerts
              </Text>
            </View>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ false: '#2A2D45', true: tokens.colors.primary.DEFAULT }}
          />
        </View>
      </Card>

      {/* Privacy & Moderation Section */}
      <Card className="p-2 mb-5 bg-surface-light dark:bg-surface-dark">
        <TouchableOpacity
          onPress={() => router.push('/(app)/blocked')}
          className="flex-row items-center justify-between p-3 border-b border-border-light dark:border-border-dark"
        >
          <View className="flex-row items-center">
            <Users size={18} color="#8E92B0" />
            <Text className="text-sm font-semibold text-content-light dark:text-content-dark ml-3">
              Blocked Members
            </Text>
          </View>
          <ChevronRight size={18} color="#8E92B0" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setRulesModalVisible(true)}
          className="flex-row items-center justify-between p-3"
        >
          <View className="flex-row items-center">
            <ShieldAlert size={18} color="#8E92B0" />
            <Text className="text-sm font-semibold text-content-light dark:text-content-dark ml-3">
              Community Privacy Rules
            </Text>
          </View>
          <ChevronRight size={18} color="#8E92B0" />
        </TouchableOpacity>
      </Card>

      {/* App Info Card */}
      <Card className="p-4 mb-6 bg-surface-light dark:bg-surface-dark flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Info size={18} color="#8E92B0" />
          <View className="ml-2.5">
            <Text className="text-sm font-semibold text-content-light dark:text-content-dark">
              Anonchat Mobile
            </Text>
            <Text className="text-xs text-muted-light dark:text-muted-dark">
              Version 1.0.0 • Build 1
            </Text>
          </View>
        </View>
        <Text className="text-xs font-semibold text-primary dark:text-primary-light">
          Up to date
        </Text>
      </Card>

      {/* Log Out Button */}
      <Button
        title="Log Out"
        variant="outline"
        size="lg"
        icon={<LogOut size={18} color={tokens.colors.danger} />}
        onPress={() => setLogoutDialogVisible(true)}
        className="border-red-500/20"
      />

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        visible={logoutDialogVisible}
        title="Log Out"
        message="Are you sure you want to log out? Your secure refresh token will be revoked on this device."
        confirmLabel="Log Out"
        cancelLabel="Cancel"
        isDestructive
        loading={loggingOut}
        onConfirm={handleLogout}
        onCancel={() => setLogoutDialogVisible(false)}
      />

      {/* Community Rules Modal */}
      <Modal
        visible={rulesModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRulesModalVisible(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/75 px-6">
          <View className="w-full max-w-sm rounded-3xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 shadow-2xl">
            <Text className="text-xl font-bold text-content-light dark:text-content-dark mb-3">
              Community Privacy Rules
            </Text>

            <ScrollView className="max-h-80 mb-5">
              <Text className="text-xs text-muted-light dark:text-muted-dark leading-relaxed">
                1. <Text className="font-bold text-content-light dark:text-content-dark">Absolute Anonymity:</Text> You are identified solely by your assigned handle (e.g., Anonymous_4821). Real names and institutional emails are encrypted and never disclosed.{'\n\n'}
                2. <Text className="font-bold text-content-light dark:text-content-dark">Zero Surveillance:</Text> Community administrators cannot read peer-to-peer conversations. Only when a member submits a report is a forensic snapshot of the latest 30 messages captured for moderation.{'\n\n'}
                3. <Text className="font-bold text-content-light dark:text-content-dark">Anti-Harassment & Integrity:</Text> Spam, hate speech, threats, and harassment result in immediate account suspension or permanent banning.{'\n\n'}
                4. <Text className="font-bold text-content-light dark:text-content-dark">No Doxxing:</Text> Attempting to deduce, reveal, or share real-world identities is strictly prohibited.
              </Text>
            </ScrollView>

            <Button
              title="Close"
              variant="primary"
              size="md"
              onPress={() => setRulesModalVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

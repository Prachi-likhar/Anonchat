import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import {
  Copy,
  Check,
  KeyRound,
  Trash2,
  ShieldAlert,
  ArrowRight,
  Shield,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { api } from '../../src/api/client';
import { maskEmail } from '../../src/lib/format';
import { formatErrorMessage } from '../../src/lib/errors';
import {
  Card,
  Avatar,
  Badge,
  Button,
  TextField,
  SegmentedControl,
} from '../../src/components/ui';
import { tokens } from '../../src/theme/tokens';
import { toast } from '../../src/store/toastStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateUser, logout } = useAuthStore();

  const [copied, setCopied] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

  // Private profile edit state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [gender, setGender] = useState<'male' | 'female'>(user?.gender || 'male');
  const [savingProfile, setSavingProfile] = useState(false);

  // Change password modal state
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);

  // Delete account modal state
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleCopyHandle = async () => {
    if (!user?.anonUsername) return;
    await Clipboard.setStringAsync(user.anonUsername);
    setCopied(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {
      // safe
    }
    toast.info(`Copied ${user.anonUsername}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectColor = async (color: string) => {
    if (!user || user.avatarColor === color || updatingAvatar) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {
      // safe
    }
    // Optimistic update
    updateUser({ avatarColor: color });
    setUpdatingAvatar(true);
    try {
      await api.patch('/me', { avatarColor: color });
      toast.success('Avatar color updated');
    } catch (err) {
      toast.error(formatErrorMessage(err));
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const handleSavePrivateProfile = async () => {
    setSavingProfile(true);
    try {
      await api.patch('/me', {
        fullName: fullName.trim(),
        gender,
      });
      updateUser({ fullName: fullName.trim(), gender });
      toast.success('Private details saved');
    } catch (err) {
      toast.error(formatErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setChangePasswordError('Please enter current and new passwords.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePasswordError("New passwords don't match.");
      return;
    }
    if (newPassword.length < 8) {
      setChangePasswordError('New password must be at least 8 characters long.');
      return;
    }

    setChangePasswordLoading(true);
    setChangePasswordError(null);
    try {
      await api.post('/me/change-password', {
        currentPassword,
        newPassword,
      });
      setChangePasswordVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully.');
    } catch (err) {
      setChangePasswordError(formatErrorMessage(err));
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('Please enter your password to confirm deletion.');
      return;
    }

    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await api.delete('/me', {
        data: { password: deletePassword },
      });
      setDeleteVisible(false);
      await logout();
      router.replace('/(auth)/welcome');
      toast.info('Your account has been deleted.');
    } catch (err) {
      setDeleteError(formatErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-background-light dark:bg-background-dark"
      contentContainerStyle={{ padding: 20, paddingTop: 52, paddingBottom: 40 }}
    >
      <View className="mb-4">
        <Text className="text-2xl font-bold text-content-light dark:text-content-dark">
          My Profile
        </Text>
        <Text className="text-xs text-muted-light dark:text-muted-dark mt-0.5">
          Manage your anonymous identity and private credentials.
        </Text>
      </View>

      {/* Identity Card */}
      <Card className="p-5 mb-5 items-center bg-surface-light dark:bg-surface-dark border-primary/20">
        <Avatar
          color={user?.avatarColor}
          anonUsername={user?.anonUsername}
          size="xl"
          className="mb-3"
        />

        <View className="flex-row items-center mb-1">
          <Text className="text-2xl font-bold text-content-light dark:text-content-dark">
            {user?.anonUsername || 'Anonymous'}
          </Text>
          <TouchableOpacity
            onPress={handleCopyHandle}
            className="ml-2.5 p-1.5 rounded-lg bg-surface-2-light dark:bg-surface-2-dark"
          >
            {copied ? (
              <Check size={16} color={tokens.colors.online} />
            ) : (
              <Copy size={16} color="#8E92B0" />
            )}
          </TouchableOpacity>
        </View>

        <Text className="text-xs text-muted-light dark:text-muted-dark mb-3">
          {user ? maskEmail(user.email) : ''}
        </Text>

        <View className="flex-row space-x-2">
          <Badge label="Permanent Handle" variant="primary" size="sm" />
          {user?.role === 'admin' && (
            <Badge label="Community Admin" variant="warning" size="sm" />
          )}
        </View>
      </Card>

      {/* Avatar Color Picker */}
      <Card className="p-4 mb-5 bg-surface-light dark:bg-surface-dark">
        <Text className="text-sm font-bold text-content-light dark:text-content-dark mb-1">
          Avatar Color Swatch
        </Text>
        <Text className="text-xs text-muted-light dark:text-muted-dark mb-3">
          Choose the color displayed next to your anonymous handle in chats.
        </Text>

        <View className="flex-row flex-wrap justify-between">
          {tokens.avatarColors.map((color) => {
            const isSelected = user?.avatarColor === color;
            return (
              <TouchableOpacity
                key={color}
                onPress={() => handleSelectColor(color)}
                className="w-12 h-12 rounded-full items-center justify-center m-1 shadow-sm"
                style={{ backgroundColor: color }}
              >
                {isSelected && <Check size={20} color="#FFFFFF" />}
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* Private Details Card */}
      <Card className="p-4 mb-5 bg-surface-light dark:bg-surface-dark">
        <Text className="text-sm font-bold text-content-light dark:text-content-dark mb-1">
          Private Details (Never Shared)
        </Text>
        <Text className="text-xs text-muted-light dark:text-muted-dark mb-4">
          Visible only to you for institutional verification.
        </Text>

        <TextField
          label="Full Name"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Your full name"
        />

        <View className="mb-4">
          <Text className="text-sm font-medium mb-1.5 text-content-light dark:text-content-dark">
            Gender Category
          </Text>
          <SegmentedControl
            options={[
              { label: '♂ Male', value: 'male' },
              { label: '♀ Female', value: 'female' },
            ]}
            value={gender}
            onChange={(val) => setGender(val as 'male' | 'female')}
          />
        </View>

        <Button
          title="Save Private Details"
          variant="secondary"
          size="md"
          loading={savingProfile}
          onPress={handleSavePrivateProfile}
        />
      </Card>

      {/* Account Security Card */}
      <Card className="p-4 mb-5 bg-surface-light dark:bg-surface-dark space-y-3">
        <Text className="text-sm font-bold text-content-light dark:text-content-dark mb-1">
          Security & Actions
        </Text>

        <Button
          title="Change Password"
          variant="outline"
          size="md"
          icon={<KeyRound size={16} color={tokens.colors.primary.DEFAULT} />}
          onPress={() => setChangePasswordVisible(true)}
        />

        <View className="h-2" />

        <Button
          title="Delete Account"
          variant="ghost"
          size="md"
          icon={<Trash2 size={16} color={tokens.colors.danger} />}
          onPress={() => setDeleteVisible(true)}
          className="border border-red-500/20"
        />
      </Card>

      {/* Admin Portal Entry (Only for Admins) */}
      {user?.role === 'admin' && (
        <Card className="p-4 mb-6 bg-amber-500/10 border-amber-500/30">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <Shield size={20} color="#F59E0B" />
              <View className="ml-3 flex-1">
                <Text className="text-sm font-bold text-content-light dark:text-content-dark">
                  Admin Moderation Console
                </Text>
                <Text className="text-xs text-muted-light dark:text-muted-dark">
                  Access reports queue and user moderation.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(admin)')}
              className="p-2 rounded-xl bg-amber-500/20"
            >
              <ArrowRight size={18} color="#F59E0B" />
            </TouchableOpacity>
          </View>
        </Card>
      )}

      {/* Change Password Modal */}
      <Modal
        visible={changePasswordVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setChangePasswordVisible(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/75 px-6">
          <View className="w-full max-w-sm rounded-3xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 shadow-2xl">
            <Text className="text-xl font-bold text-content-light dark:text-content-dark mb-2">
              Change Password
            </Text>
            <Text className="text-xs text-muted-light dark:text-muted-dark mb-4">
              Enter your current password and choose a new secure password.
            </Text>

            {changePasswordError && (
              <Card className="bg-red-500/10 border-red-500/30 p-3 mb-3">
                <Text className="text-xs text-danger font-medium">
                  {changePasswordError}
                </Text>
              </Card>
            )}

            <TextField
              label="Current Password"
              secureTextEntry
              showPasswordToggle
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />

            <TextField
              label="New Password"
              secureTextEntry
              showPasswordToggle
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <TextField
              label="Confirm New Password"
              secureTextEntry
              showPasswordToggle
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <View className="flex-row space-x-3 mt-2">
              <View className="flex-1">
                <Button
                  title="Cancel"
                  variant="secondary"
                  size="md"
                  onPress={() => setChangePasswordVisible(false)}
                  disabled={changePasswordLoading}
                />
              </View>
              <View className="flex-1">
                <Button
                  title="Update"
                  variant="primary"
                  size="md"
                  loading={changePasswordLoading}
                  onPress={handleChangePassword}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={deleteVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteVisible(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/75 px-6">
          <View className="w-full max-w-sm rounded-3xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 shadow-2xl">
            <View className="w-12 h-12 rounded-full bg-red-500/20 items-center justify-center mb-3">
              <ShieldAlert size={24} color={tokens.colors.danger} />
            </View>

            <Text className="text-xl font-bold text-content-light dark:text-content-dark mb-1">
              Delete Account?
            </Text>
            <Text className="text-xs text-muted-light dark:text-muted-dark mb-4 leading-relaxed">
              This action is permanent and cannot be undone. All your messages, profile, and conversations will be deleted.
            </Text>

            {deleteError && (
              <Card className="bg-red-500/10 border-red-500/30 p-3 mb-3">
                <Text className="text-xs text-danger font-medium">
                  {deleteError}
                </Text>
              </Card>
            )}

            <TextField
              label="Confirm with Password"
              placeholder="Enter your account password"
              secureTextEntry
              showPasswordToggle
              value={deletePassword}
              onChangeText={setDeletePassword}
            />

            <View className="flex-row space-x-3 mt-2">
              <View className="flex-1">
                <Button
                  title="Cancel"
                  variant="secondary"
                  size="md"
                  onPress={() => setDeleteVisible(false)}
                  disabled={deleteLoading}
                />
              </View>
              <View className="flex-1">
                <Button
                  title="Delete"
                  variant="danger"
                  size="md"
                  loading={deleteLoading}
                  onPress={handleDeleteAccount}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

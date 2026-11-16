import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ShieldX, UserCheck, ShieldAlert } from 'lucide-react-native';
import {
  getAdminUser,
  suspendUser,
  banUser,
  reinstateUser,
} from '@/api/admin';
import { Card, Badge, Button, TextField } from '@/components/ui';
import { formatFullDate } from '@/lib/format';
import { formatErrorMessage } from '@/lib/errors';
import { tokens } from '@/theme/tokens';
import { toast } from '@/store/toastStore';

export default function AdminUserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  // Modals state
  const [suspendModalVisible, setSuspendModalVisible] = useState(false);
  const [suspendDuration, setSuspendDuration] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [suspendReason, setSuspendReason] = useState('Repeated inappropriate conduct');
  const [suspendLoading, setSuspendLoading] = useState(false);

  const [banModalVisible, setBanModalVisible] = useState(false);
  const [banReason, setBanReason] = useState('Severe terms of service violation');
  const [banLoading, setBanLoading] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => getAdminUser(id!),
    enabled: Boolean(id),
  });

  const reinstateMutation = useMutation({
    mutationFn: () => reinstateUser(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Member reinstated successfully');
    },
    onError: (err) => {
      toast.error(formatErrorMessage(err));
    },
  });

  const handleSuspend = async () => {
    if (!id || !suspendReason.trim()) return;
    setSuspendLoading(true);

    const now = new Date();
    const durationMap = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
    };
    const until = new Date(now.getTime() + durationMap[suspendDuration]).toISOString();

    try {
      await suspendUser(id, until, suspendReason.trim());
      setSuspendModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['admin-user', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`Member suspended for ${suspendDuration}`);
    } catch (err) {
      toast.error(formatErrorMessage(err));
    } finally {
      setSuspendLoading(false);
    }
  };

  const handleBan = async () => {
    if (!id || !banReason.trim()) return;
    setBanLoading(true);
    try {
      await banUser(id, banReason.trim());
      setBanModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['admin-user', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Member permanently banned');
    } catch (err) {
      toast.error(formatErrorMessage(err));
    } finally {
      setBanLoading(false);
    }
  };

  if (isLoading || !user) {
    return (
      <View className="flex-1 items-center justify-center bg-background-light dark:bg-background-dark">
        <ActivityIndicator size="large" color={tokens.colors.primary.DEFAULT} />
      </View>
    );
  }

  const statusVariant = {
    active: 'online',
    suspended: 'warning',
    banned: 'danger',
    unverified: 'default',
  }[user.status] as any;

  return (
    <ScrollView
      className="flex-1 bg-background-light dark:bg-background-dark"
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      {/* Identity Card */}
      <Card className="p-5 mb-5 bg-surface-light dark:bg-surface-dark border-primary/20">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-2xl font-bold text-content-light dark:text-content-dark">
            {user.anonUsername}
          </Text>
          <Badge label={user.status} variant={statusVariant} size="md" />
        </View>

        <Text className="text-sm text-muted-light dark:text-muted-dark mb-4">
          {user.email}
        </Text>

        <View className="flex-row space-x-2">
          <Badge
            label={user.gender === 'female' ? '♀ Female' : '♂ Male'}
            size="sm"
          />
          <Badge label={`Role: ${user.role}`} size="sm" />
          {user.reportCount > 0 && (
            <Badge
              label={`${user.reportCount} reports`}
              variant="danger"
              size="sm"
            />
          )}
        </View>
      </Card>

      {/* Details Table */}
      <Card className="p-4 mb-5 bg-surface-light dark:bg-surface-dark space-y-2.5">
        <Text className="text-sm font-bold text-content-light dark:text-content-dark mb-1">
          Account Metadata
        </Text>

        <View className="flex-row justify-between py-1 border-b border-border-light dark:border-border-dark">
          <Text className="text-xs text-muted-light dark:text-muted-dark">User ID</Text>
          <Text className="text-xs font-mono text-content-light dark:text-content-dark">
            {user.id}
          </Text>
        </View>

        <View className="flex-row justify-between py-1 border-b border-border-light dark:border-border-dark">
          <Text className="text-xs text-muted-light dark:text-muted-dark">Joined</Text>
          <Text className="text-xs text-content-light dark:text-content-dark">
            {formatFullDate(user.createdAt)}
          </Text>
        </View>

        <View className="flex-row justify-between py-1 border-b border-border-light dark:border-border-dark">
          <Text className="text-xs text-muted-light dark:text-muted-dark">Last Seen</Text>
          <Text className="text-xs text-content-light dark:text-content-dark">
            {user.lastSeenAt ? formatFullDate(user.lastSeenAt) : 'Never'}
          </Text>
        </View>

        {user.suspendedUntil && (
          <View className="flex-row justify-between py-1">
            <Text className="text-xs text-amber-500 font-semibold">Suspended Until</Text>
            <Text className="text-xs text-amber-500 font-bold">
              {new Date(user.suspendedUntil).toLocaleString()}
            </Text>
          </View>
        )}
      </Card>

      {/* Moderation Actions */}
      <Card className="p-4 mb-6 bg-surface-light dark:bg-surface-dark space-y-3">
        <Text className="text-sm font-bold text-content-light dark:text-content-dark mb-1">
          Moderation Control
        </Text>

        {user.status === 'active' && (
          <>
            <Button
              title="Suspend Member"
              variant="secondary"
              size="md"
              icon={<AlertTriangle size={16} color="#F59E0B" />}
              onPress={() => setSuspendModalVisible(true)}
            />
            <View className="h-2" />
            <Button
              title="Ban Member Permanently"
              variant="outline"
              size="md"
              icon={<ShieldX size={16} color={tokens.colors.danger} />}
              onPress={() => setBanModalVisible(true)}
              className="border-red-500/20"
            />
          </>
        )}

        {(user.status === 'suspended' || user.status === 'banned') && (
          <Button
            title="Reinstate Member"
            variant="primary"
            size="md"
            icon={<UserCheck size={16} color="#FFFFFF" />}
            loading={reinstateMutation.isPending}
            onPress={() => reinstateMutation.mutate()}
          />
        )}
      </Card>

      {/* Suspend Modal */}
      <Modal
        visible={suspendModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSuspendModalVisible(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/75 px-6">
          <View className="w-full max-w-sm rounded-3xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 shadow-2xl">
            <Text className="text-xl font-bold text-content-light dark:text-content-dark mb-1">
              Suspend Member
            </Text>
            <Text className="text-xs text-muted-light dark:text-muted-dark mb-4">
              Select duration and provide a reason for suspension.
            </Text>

            <Text className="text-xs font-semibold text-content-light dark:text-content-dark mb-2">
              Duration
            </Text>
            <View className="flex-row space-x-2 mb-4">
              {(['24h', '7d', '30d', '90d'] as const).map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => setSuspendDuration(d)}
                  className={`flex-1 py-2 rounded-xl items-center border ${
                    suspendDuration === d
                      ? 'bg-primary border-primary'
                      : 'bg-surface-2-light dark:bg-surface-2-dark border-border-light dark:border-border-dark'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      suspendDuration === d
                        ? 'text-white'
                        : 'text-content-light dark:text-content-dark'
                    }`}
                  >
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextField
              label="Reason for suspension"
              value={suspendReason}
              onChangeText={setSuspendReason}
            />

            <View className="flex-row space-x-3 mt-2">
              <View className="flex-1">
                <Button
                  title="Cancel"
                  variant="secondary"
                  size="md"
                  onPress={() => setSuspendModalVisible(false)}
                  disabled={suspendLoading}
                />
              </View>
              <View className="flex-1">
                <Button
                  title="Suspend"
                  variant="primary"
                  size="md"
                  loading={suspendLoading}
                  onPress={handleSuspend}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Ban Modal */}
      <Modal
        visible={banModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBanModalVisible(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/75 px-6">
          <View className="w-full max-w-sm rounded-3xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 shadow-2xl">
            <View className="w-12 h-12 rounded-full bg-red-500/20 items-center justify-center mb-3">
              <ShieldAlert size={24} color={tokens.colors.danger} />
            </View>

            <Text className="text-xl font-bold text-content-light dark:text-content-dark mb-1">
              Permanent Ban
            </Text>
            <Text className="text-xs text-muted-light dark:text-muted-dark mb-4">
              Permanently revokes all access to Anonchat for this member.
            </Text>

            <TextField
              label="Reason for permanent ban"
              value={banReason}
              onChangeText={setBanReason}
            />

            <View className="flex-row space-x-3 mt-2">
              <View className="flex-1">
                <Button
                  title="Cancel"
                  variant="secondary"
                  size="md"
                  onPress={() => setBanModalVisible(false)}
                  disabled={banLoading}
                />
              </View>
              <View className="flex-1">
                <Button
                  title="Confirm Ban"
                  variant="danger"
                  size="md"
                  loading={banLoading}
                  onPress={handleBan}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

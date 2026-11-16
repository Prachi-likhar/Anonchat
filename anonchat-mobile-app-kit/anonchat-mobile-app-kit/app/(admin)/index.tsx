import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  MessageSquare,
  ShieldAlert,
  Radio,
  ArrowRight,
  Shield,
} from 'lucide-react-native';
import { getAdminStats } from '@/api/admin';
import { Card, Button, Skeleton } from '@/components/ui';
import { tokens } from '@/theme/tokens';

export default function AdminIndexScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: stats, isLoading, isRefetching } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getAdminStats,
  });

  return (
    <ScrollView
      className="flex-1 bg-background-light dark:bg-background-dark"
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['admin-stats'] })}
          tintColor={tokens.colors.primary.DEFAULT}
        />
      }
    >
      <View className="mb-6">
        <View className="flex-row items-center mb-1">
          <Shield size={22} color="#F59E0B" />
          <Text className="text-2xl font-bold text-content-light dark:text-content-dark ml-2">
            Admin Console
          </Text>
        </View>
        <Text className="text-xs text-muted-light dark:text-muted-dark">
          Platform health metrics and moderation control center.
        </Text>
      </View>

      {/* Primary KPI Grid */}
      {isLoading ? (
        <View className="space-y-3 mb-6">
          <Skeleton height={80} rounded="lg" />
          <Skeleton height={80} rounded="lg" />
        </View>
      ) : (
        <View className="space-y-3 mb-6">
          <View className="flex-row space-x-3">
            <Card className="flex-1 p-4 bg-surface-light dark:bg-surface-dark">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs font-semibold text-muted-light dark:text-muted-dark">
                  Total Members
                </Text>
                <Users size={16} color={tokens.colors.primary.DEFAULT} />
              </View>
              <Text className="text-2xl font-bold text-content-light dark:text-content-dark">
                {stats?.totalUsers ?? 0}
              </Text>
            </Card>

            <Card className="flex-1 p-4 bg-surface-light dark:bg-surface-dark">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs font-semibold text-muted-light dark:text-muted-dark">
                  Online Now
                </Text>
                <Radio size={16} color={tokens.colors.online} />
              </View>
              <Text className="text-2xl font-bold text-online">
                {stats?.onlineNow ?? 0}
              </Text>
            </Card>
          </View>

          <View className="flex-row space-x-3">
            <Card className="flex-1 p-4 bg-surface-light dark:bg-surface-dark">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs font-semibold text-muted-light dark:text-muted-dark">
                  Active Chats
                </Text>
                <MessageSquare size={16} color="#3B82F6" />
              </View>
              <Text className="text-2xl font-bold text-content-light dark:text-content-dark">
                {stats?.conversationsActive ?? 0}
              </Text>
            </Card>

            <Card className="flex-1 p-4 bg-surface-light dark:bg-surface-dark">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs font-semibold text-muted-light dark:text-muted-dark">
                  Open Reports
                </Text>
                <ShieldAlert size={16} color={tokens.colors.danger} />
              </View>
              <Text className="text-2xl font-bold text-danger">
                {stats?.openReports ?? 0}
              </Text>
            </Card>
          </View>
        </View>
      )}

      {/* Gender Balance Card */}
      <Card className="p-4 mb-6 bg-surface-light dark:bg-surface-dark">
        <Text className="text-sm font-bold text-content-light dark:text-content-dark mb-2">
          Community Gender Balance
        </Text>
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xs text-muted-light dark:text-muted-dark">
            ♂ Male: {stats?.male ?? 0}
          </Text>
          <Text className="text-xs text-muted-light dark:text-muted-dark">
            ♀ Female: {stats?.female ?? 0}
          </Text>
        </View>
        <View className="flex-row h-2 rounded-full overflow-hidden bg-surface-2-light dark:bg-surface-2-dark">
          <View
            style={{
              flex: (stats?.male || 1) / ((stats?.male || 1) + (stats?.female || 1)),
              backgroundColor: '#3B82F6',
            }}
          />
          <View
            style={{
              flex: (stats?.female || 1) / ((stats?.male || 1) + (stats?.female || 1)),
              backgroundColor: '#EC4899',
            }}
          />
        </View>
      </Card>

      {/* Navigation Links */}
      <Card className="p-4 mb-6 bg-surface-light dark:bg-surface-dark space-y-3">
        <Text className="text-sm font-bold text-content-light dark:text-content-dark mb-1">
          Moderation Tools
        </Text>

        <TouchableOpacity
          onPress={() => router.push('/(admin)/reports')}
          className="flex-row items-center justify-between p-3.5 rounded-xl bg-surface-2-light dark:bg-surface-2-dark border border-border-light dark:border-border-dark"
        >
          <View className="flex-row items-center">
            <ShieldAlert size={18} color={tokens.colors.danger} />
            <Text className="text-sm font-semibold text-content-light dark:text-content-dark ml-3">
              Reports Triage Queue
            </Text>
          </View>
          <View className="flex-row items-center">
            {(stats?.openReports ?? 0) > 0 && (
              <View className="px-2 py-0.5 rounded-full bg-danger mr-2">
                <Text className="text-xs font-bold text-white">
                  {stats?.openReports}
                </Text>
              </View>
            )}
            <ArrowRight size={16} color="#8E92B0" />
          </View>
        </TouchableOpacity>

        <View className="h-1" />

        <TouchableOpacity
          onPress={() => router.push('/(admin)/users')}
          className="flex-row items-center justify-between p-3.5 rounded-xl bg-surface-2-light dark:bg-surface-2-dark border border-border-light dark:border-border-dark"
        >
          <View className="flex-row items-center">
            <Users size={18} color={tokens.colors.primary.DEFAULT} />
            <Text className="text-sm font-semibold text-content-light dark:text-content-dark ml-3">
              User Directory & Bans
            </Text>
          </View>
          <ArrowRight size={16} color="#8E92B0" />
        </TouchableOpacity>
      </Card>

      <Button
        title="Back to App"
        variant="secondary"
        onPress={() => router.replace('/(app)')}
      />
    </ScrollView>
  );
}

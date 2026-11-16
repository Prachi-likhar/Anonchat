import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, ChevronRight } from 'lucide-react-native';
import { getAdminReports } from '@/api/admin';
import { AdminReport } from '@/types/api';
import { Card, Badge, FilterChips, Skeleton, EmptyState } from '@/components/ui';
import { formatTimeAgo } from '@/lib/format';
import { tokens } from '@/theme/tokens';

export default function AdminReportsScreen() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<'open' | 'reviewing' | 'resolved' | 'dismissed'>('open');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-reports', statusFilter],
    queryFn: () => getAdminReports({ status: statusFilter, limit: 30 }),
  });

  const reports = data?.items || [];

  const filterChips = [
    { label: 'Open', value: 'open' },
    { label: 'Reviewing', value: 'reviewing' },
    { label: 'Resolved', value: 'resolved' },
    { label: 'Dismissed', value: 'dismissed' },
  ];

  const renderReport = ({ item }: { item: AdminReport }) => {
    const statusVariant = {
      open: 'danger',
      reviewing: 'warning',
      resolved: 'online',
      dismissed: 'default',
    }[item.status] as any;

    return (
      <Card
        onPress={() => router.push(`/(admin)/report/${item.id}`)}
        className="p-3.5 mb-2.5 bg-surface-light dark:bg-surface-dark"
      >
        <View className="flex-row items-center justify-between mb-2">
          <Badge label={item.reason} variant="danger" size="sm" />
          <Badge label={item.status} variant={statusVariant} size="sm" />
        </View>

        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-bold text-content-light dark:text-content-dark">
              Against: {item.reportedAnon}
            </Text>
            <Text className="text-xs text-muted-light dark:text-muted-dark mt-0.5">
              By: {item.reporterAnon} • {formatTimeAgo(item.createdAt)}
            </Text>
          </View>
          <ChevronRight size={18} color="#8E92B0" />
        </View>
      </Card>
    );
  };

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark p-4">
      <View className="mb-3">
        <FilterChips
          chips={filterChips}
          selected={statusFilter}
          onSelect={(val) => setStatusFilter(val as any)}
        />
      </View>

      {isLoading ? (
        <View className="space-y-2.5 pt-2">
          <Skeleton height={80} rounded="lg" />
          <Skeleton height={80} rounded="lg" />
          <Skeleton height={80} rounded="lg" />
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderReport}
          contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={tokens.colors.primary.DEFAULT}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<ShieldAlert size={36} color={tokens.colors.online} />}
              title="Queue Clean"
              description={`No reports in "${statusFilter}" status right now.`}
              className="mt-16"
            />
          }
        />
      )}
    </View>
  );
}

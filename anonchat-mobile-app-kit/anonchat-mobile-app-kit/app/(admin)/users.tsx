import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Users, ChevronRight } from 'lucide-react-native';
import { getAdminUsers } from '@/api/admin';
import { AdminUser } from '@/types/api';
import { Card, Badge, TextField, FilterChips, Skeleton, EmptyState } from '@/components/ui';
import { tokens } from '@/theme/tokens';

export default function AdminUsersScreen() {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-users', statusFilter, debouncedSearch],
    queryFn: () =>
      getAdminUsers({
        status: statusFilter === 'all' ? undefined : statusFilter,
        q: debouncedSearch,
        limit: 30,
      }),
  });

  const users = data?.items || [];

  const filterChips = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Suspended', value: 'suspended' },
    { label: 'Banned', value: 'banned' },
  ];

  const renderUser = ({ item }: { item: AdminUser }) => {
    const statusVariant = {
      active: 'online',
      suspended: 'warning',
      banned: 'danger',
      unverified: 'default',
    }[item.status] as any;

    return (
      <Card
        onPress={() => router.push(`/(admin)/user/${item.id}`)}
        className="flex-row items-center p-3.5 mb-2.5 bg-surface-light dark:bg-surface-dark"
      >
        <View className="flex-1 mr-2">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-base font-bold text-content-light dark:text-content-dark">
              {item.anonUsername}
            </Text>
            <Badge label={item.status} variant={statusVariant} size="sm" />
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-muted-light dark:text-muted-dark">
              {item.email}
            </Text>
            {item.reportCount > 0 && (
              <Badge
                label={`${item.reportCount} reports`}
                variant="danger"
                size="sm"
              />
            )}
          </View>
        </View>

        <ChevronRight size={18} color="#8E92B0" />
      </Card>
    );
  };

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark p-4">
      <View className="mb-2">
        <TextField
          placeholder="Search by email or Anonymous_xxxx..."
          value={search}
          onChangeText={setSearch}
          leftIcon={<Search size={18} color="#8E92B0" />}
          rightIcon={
            search ? (
              <TouchableOpacity onPress={() => setSearch('')}>
                <X size={18} color="#8E92B0" />
              </TouchableOpacity>
            ) : undefined
          }
          autoCapitalize="none"
        />
      </View>

      <View className="mb-3">
        <FilterChips
          chips={filterChips}
          selected={statusFilter}
          onSelect={setStatusFilter}
        />
      </View>

      {isLoading ? (
        <View className="space-y-2.5 pt-2">
          <Skeleton height={70} rounded="lg" />
          <Skeleton height={70} rounded="lg" />
          <Skeleton height={70} rounded="lg" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
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
              icon={<Users size={36} color="#8E92B0" />}
              title="No Users Found"
              description="No members match the current search or status filters."
              className="mt-16"
            />
          }
        />
      )}
    </View>
  );
}

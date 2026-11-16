import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, X, MessageSquare, Compass } from 'lucide-react-native';
import { getMembers, startConversation } from '../../src/api/members';
import { PublicMember } from '../../src/types/api';
import { formatErrorMessage } from '../../src/lib/errors';
import {
  Card,
  Avatar,
  Badge,
  FilterChips,
  TextField,
  Skeleton,
  EmptyState,
} from '../../src/components/ui';
import { tokens } from '../../src/theme/tokens';
import { toast } from '../../src/store/toastStore';

type FilterType = 'all' | 'male' | 'female' | 'online';

export default function DiscoverScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [startingChatId, setStartingChatId] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Query members
  const {
    data,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['members', filter, debouncedSearch],
    queryFn: () => getMembers({ filter, search: debouncedSearch, limit: 30 }),
  });

  const startChatMutation = useMutation({
    mutationFn: (memberId: string) => startConversation(memberId),
    onSuccess: (conv) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      router.push(`/(app)/chat/${conv.id}`);
    },
    onError: (err) => {
      toast.error(formatErrorMessage(err));
    },
    onSettled: () => {
      setStartingChatId(null);
    },
  });

  const handleStartChat = (member: PublicMember) => {
    setStartingChatId(member.id);
    startChatMutation.mutate(member.id);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const members = data?.items || [];

  const filterChips = [
    { label: 'All', value: 'all' },
    { label: '♂ Male', value: 'male' },
    { label: '♀ Female', value: 'female' },
    { label: '● Online', value: 'online' },
  ];

  const renderMember = ({ item }: { item: PublicMember }) => {
    const isStarting = startingChatId === item.id;

    return (
      <Card className="flex-row items-center p-4 mb-3 bg-surface-light dark:bg-surface-dark">
        <Avatar
          color={item.avatarColor}
          anonUsername={item.anonUsername}
          size="md"
          showOnlineStatus
          isOnline={item.isOnline}
        />

        <View className="flex-1 ml-3 mr-2">
          <View className="flex-row items-center">
            <Text className="text-base font-bold text-content-light dark:text-content-dark">
              {item.anonUsername}
            </Text>
            {item.isOnline && (
              <View className="w-2 h-2 rounded-full bg-online ml-2" />
            )}
          </View>

          <View className="flex-row items-center mt-1">
            <Badge
              label={item.gender === 'female' ? '♀ Female' : '♂ Male'}
              size="sm"
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={() => handleStartChat(item)}
          disabled={isStarting}
          className="flex-row items-center py-2 px-3.5 rounded-xl bg-primary shadow-sm"
          accessibilityRole="button"
          accessibilityLabel={`Start chat with ${item.anonUsername}`}
        >
          {isStarting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MessageSquare size={14} color="#FFFFFF" />
              <Text className="text-xs font-semibold text-white ml-1.5">
                Chat
              </Text>
            </>
          )}
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark p-4 pt-12">
      <View className="mb-2">
        <Text className="text-2xl font-bold text-content-light dark:text-content-dark">
          Discover Members
        </Text>
        <Text className="text-xs text-muted-light dark:text-muted-dark mt-0.5">
          Find peers by anonymous handle or gender category.
        </Text>
      </View>

      {/* Search Input */}
      <View className="mt-2 mb-1">
        <TextField
          placeholder="Search by Anonymous_xxxx..."
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
          autoCorrect={false}
        />
      </View>

      {/* Filter Chips */}
      <View className="mb-3">
        <FilterChips
          chips={filterChips}
          selected={filter}
          onSelect={(val) => setFilter(val as FilterType)}
        />
      </View>

      {/* Members List */}
      {isLoading ? (
        <View className="space-y-3 pt-2">
          <Skeleton height={74} rounded="lg" />
          <Skeleton height={74} rounded="lg" />
          <Skeleton height={74} rounded="lg" />
          <Skeleton height={74} rounded="lg" />
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={renderMember}
          contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || isRefetching}
              onRefresh={handleRefresh}
              tintColor={tokens.colors.primary.DEFAULT}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<Compass size={36} color="#8E92B0" />}
              title="No Members Found"
              description={
                search
                  ? `No community member matches "${search}".`
                  : 'No active members match this category right now.'
              }
              action={{
                label: 'Reset Filters',
                onPress: () => {
                  setFilter('all');
                  setSearch('');
                },
              }}
              className="mt-12"
            />
          }
        />
      )}
    </View>
  );
}

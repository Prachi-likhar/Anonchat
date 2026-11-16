import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { getBlockedMembers, unblockMember } from '../../src/api/blocks';
import { PublicMember } from '../../src/types/api';
import { formatErrorMessage } from '../../src/lib/errors';
import { Card, Avatar, Badge, EmptyState, Skeleton, ConfirmDialog } from '../../src/components/ui';
import { tokens } from '../../src/theme/tokens';
import { toast } from '../../src/store/toastStore';

export default function BlockedScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedMember, setSelectedMember] = useState<PublicMember | null>(null);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['blocks'],
    queryFn: getBlockedMembers,
  });

  const unblockMutation = useMutation({
    mutationFn: (memberId: string) => unblockMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Member unblocked successfully');
      setSelectedMember(null);
    },
    onError: (err) => {
      toast.error(formatErrorMessage(err));
    },
    onSettled: () => {
      setUnblockingId(null);
    },
  });

  const handleConfirmUnblock = () => {
    if (!selectedMember) return;
    setUnblockingId(selectedMember.id);
    unblockMutation.mutate(selectedMember.id);
  };

  const blockedList = data?.items || [];

  const renderBlockedItem = ({ item }: { item: PublicMember }) => {
    return (
      <Card className="flex-row items-center p-3.5 mb-3 bg-surface-light dark:bg-surface-dark">
        <Avatar
          color={item.avatarColor}
          anonUsername={item.anonUsername}
          size="md"
        />

        <View className="flex-1 ml-3 mr-2">
          <Text className="text-base font-bold text-content-light dark:text-content-dark">
            {item.anonUsername}
          </Text>
          <Badge
            label={item.gender === 'female' ? '♀ Female' : '♂ Male'}
            size="sm"
            className="mt-1"
          />
        </View>

        <TouchableOpacity
          onPress={() => setSelectedMember(item)}
          className="py-1.5 px-3 rounded-xl bg-surface-2-light dark:bg-surface-2-dark border border-border-light dark:border-border-dark"
        >
          <Text className="text-xs font-semibold text-primary dark:text-primary-light">
            Unblock
          </Text>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark p-4 pt-12">
      <View className="flex-row items-center mb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-surface-2-light dark:bg-surface-2-dark mr-3"
        >
          <ArrowLeft size={20} color={tokens.colors.content.dark} />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-bold text-content-light dark:text-content-dark">
            Blocked Members
          </Text>
          <Text className="text-xs text-muted-light dark:text-muted-dark">
            Members you block cannot view or message you.
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View className="space-y-3 pt-3">
          <Skeleton height={70} rounded="lg" />
          <Skeleton height={70} rounded="lg" />
          <Skeleton height={70} rounded="lg" />
        </View>
      ) : (
        <FlatList
          data={blockedList}
          keyExtractor={(item) => item.id}
          renderItem={renderBlockedItem}
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
              icon={<ShieldCheck size={36} color={tokens.colors.online} />}
              title="No Blocked Members"
              description="You have not blocked any members. Blocked peers will appear here where you can unblock them at any time."
              className="mt-16"
            />
          }
        />
      )}

      {/* Unblock Confirmation Dialog */}
      <ConfirmDialog
        visible={Boolean(selectedMember)}
        title="Unblock Member"
        message={`Are you sure you want to unblock ${selectedMember?.anonUsername}? They will be able to discover your handle and start conversations.`}
        confirmLabel="Unblock"
        cancelLabel="Keep Blocked"
        loading={Boolean(unblockingId)}
        onConfirm={handleConfirmUnblock}
        onCancel={() => setSelectedMember(null)}
      />
    </View>
  );
}

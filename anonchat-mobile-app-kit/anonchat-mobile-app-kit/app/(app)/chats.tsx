import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Search, X, Trash2 } from 'lucide-react-native';
import { getConversations } from '../../src/api/members';
import { deleteConversation } from '../../src/api/conversations';
import { Conversation } from '../../src/types/api';
import { formatTimeAgo } from '../../src/lib/format';
import { formatErrorMessage } from '../../src/lib/errors';
import {
  Card,
  Avatar,
  Badge,
  TextField,
  EmptyState,
  Skeleton,
  ConfirmDialog,
} from '../../src/components/ui';
import { subscribeToSocketEvents } from '../../src/socket/socketClient';
import { tokens } from '../../src/theme/tokens';
import { toast } from '../../src/store/toastStore';

export default function ChatsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [typingMap, setTypingMap] = useState<Record<string, boolean>>({});
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Query conversations
  const {
    data,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => getConversations({ limit: 50 }),
  });

  // Real-time socket events for conversation list
  useEffect(() => {
    const unsubscribe = subscribeToSocketEvents({
      onNewMessage: () => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['unread-count'] });
      },
      onMessageRead: () => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['unread-count'] });
      },
      onConversationEnded: () => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      },
      onTyping: ({ conversationId, isTyping }) => {
        setTypingMap((prev) => ({ ...prev, [conversationId]: isTyping }));
      },
    });

    return () => unsubscribe();
  }, [queryClient]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.info('Conversation removed from your list');
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(formatErrorMessage(err));
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    deleteMutation.mutate(deleteTarget.id);
  };

  const conversations = data?.items || [];
  const filteredConversations = conversations.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const matchesHandle = c.other.anonUsername.toLowerCase().includes(q);
    const matchesBody = c.lastMessage?.body.toLowerCase().includes(q) || false;
    return matchesHandle || matchesBody;
  });

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const isTyping = typingMap[item.id] || false;
    const isEnded = item.status === 'ended';

    return (
      <Card
        onPress={() => router.push(`/(app)/chat/${item.id}`)}
        className="flex-row items-center p-3.5 mb-2.5 bg-surface-light dark:bg-surface-dark"
      >
        <Avatar
          color={item.other.avatarColor}
          anonUsername={item.other.anonUsername}
          size="md"
          showOnlineStatus
          isOnline={item.other.isOnline}
        />

        <View className="flex-1 ml-3 mr-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text className="text-base font-bold text-content-light dark:text-content-dark">
                {item.other.anonUsername}
              </Text>
              {isEnded && (
                <Badge label="Ended" size="sm" className="ml-2" />
              )}
            </View>
            {item.lastMessage?.createdAt && (
              <Text className="text-xs text-muted-light dark:text-muted-dark font-medium">
                {formatTimeAgo(item.lastMessage.createdAt)}
              </Text>
            )}
          </View>

          <View className="flex-row items-center justify-between mt-1">
            <Text
              numberOfLines={1}
              className={
                isTyping
                  ? 'text-xs italic text-primary dark:text-primary-light font-medium flex-1 mr-2'
                  : 'text-xs text-muted-light dark:text-muted-dark flex-1 mr-2'
              }
            >
              {isTyping
                ? 'typing...'
                : item.lastMessage
                  ? item.lastMessage.body
                  : 'No messages yet'}
            </Text>

            {item.unreadCount > 0 && (
              <Badge label={item.unreadCount} variant="primary" size="sm" />
            )}
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setDeleteTarget(item)}
          className="p-1.5 ml-1 rounded-lg"
          accessibilityLabel="Delete conversation"
        >
          <Trash2 size={16} color="#8E92B0" />
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark p-4 pt-12">
      <View className="mb-2">
        <Text className="text-2xl font-bold text-content-light dark:text-content-dark">
          Conversations
        </Text>
        <Text className="text-xs text-muted-light dark:text-muted-dark mt-0.5">
          Your one-to-one anonymous chat threads.
        </Text>
      </View>

      {/* Search Bar */}
      <View className="mt-2 mb-2">
        <TextField
          placeholder="Filter conversations..."
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

      {/* List */}
      {isLoading ? (
        <View className="space-y-3 pt-2">
          <Skeleton height={74} rounded="lg" />
          <Skeleton height={74} rounded="lg" />
          <Skeleton height={74} rounded="lg" />
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversationItem}
          contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={tokens.colors.primary.DEFAULT}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<MessageSquare size={36} color="#8E92B0" />}
              title="No Conversations"
              description={
                search
                  ? `No conversations match "${search}".`
                  : 'Start an anonymous conversation with verified peers from Discover.'
              }
              action={{
                label: 'Find Peers',
                onPress: () => router.push('/(app)/discover'),
              }}
              className="mt-16"
            />
          }
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={Boolean(deleteTarget)}
        title="Remove Conversation"
        message={`Remove this conversation with ${deleteTarget?.other.anonUsername} from your list? Message history will be retained for the other participant unless they delete it too.`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        isDestructive
        loading={Boolean(deletingId)}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}

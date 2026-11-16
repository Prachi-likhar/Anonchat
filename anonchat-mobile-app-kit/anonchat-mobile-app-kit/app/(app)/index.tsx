import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import {
  MessageSquare,
  Compass,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
  Radio,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { getConversations, getMembers, getUnreadCount } from '../../src/api/members';
import { Card, Avatar, Button, Badge, Skeleton } from '../../src/components/ui';
import { formatTimeAgo } from '../../src/lib/format';
import { tokens } from '../../src/theme/tokens';
import { toast } from '../../src/store/toastStore';

export default function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Queries
  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: getUnreadCount,
    refetchInterval: 15000,
  });

  const { data: convData, isLoading: convLoading } = useQuery({
    queryKey: ['conversations', 'home'],
    queryFn: () => getConversations({ limit: 3 }),
  });

  const { data: onlineData, isLoading: onlineLoading } = useQuery({
    queryKey: ['members', 'online-suggested'],
    queryFn: () => getMembers({ filter: 'online', limit: 6 }),
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['unread-count'] }),
      queryClient.invalidateQueries({ queryKey: ['conversations', 'home'] }),
      queryClient.invalidateQueries({ queryKey: ['members', 'online-suggested'] }),
    ]);
    setRefreshing(false);
  };

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

  const conversations = convData?.items || [];
  const onlineMembers = (onlineData?.items || []).filter((m) => m.id !== user?.id);

  return (
    <ScrollView
      className="flex-1 bg-background-light dark:bg-background-dark"
      contentContainerStyle={{ padding: 20, paddingTop: 52 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={tokens.colors.primary.DEFAULT}
        />
      }
    >
      {/* Identity Banner Chip */}
      <Card className="p-4 mb-6 bg-surface-light dark:bg-surface-dark flex-row items-center justify-between border-primary/20">
        <View className="flex-row items-center flex-1">
          <Avatar
            color={user?.avatarColor}
            anonUsername={user?.anonUsername}
            size="md"
          />
          <View className="ml-3 flex-1">
            <View className="flex-row items-center">
              <Text className="text-base font-bold text-content-light dark:text-content-dark">
                {user?.anonUsername || 'Anonymous'}
              </Text>
              <Badge
                label={user?.gender === 'female' ? '♀ Female' : '♂ Male'}
                size="sm"
                className="ml-2"
              />
            </View>
            <Text className="text-xs text-muted-light dark:text-muted-dark mt-0.5">
              Permanent Anonymous Identity
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleCopyHandle}
          className="p-2 rounded-xl bg-surface-2-light dark:bg-surface-2-dark border border-border-light dark:border-border-dark"
          accessibilityLabel="Copy anonymous username"
        >
          {copied ? (
            <Check size={18} color={tokens.colors.online} />
          ) : (
            <Copy size={18} color="#8E92B0" />
          )}
        </TouchableOpacity>
      </Card>

      {/* Metrics Row */}
      <View className="flex-row space-x-3 mb-6">
        <Card className="flex-1 p-4 bg-surface-light dark:bg-surface-dark">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-semibold text-muted-light dark:text-muted-dark">
              Unread
            </Text>
            <MessageSquare size={16} color={tokens.colors.primary.DEFAULT} />
          </View>
          <Text className="text-2xl font-bold text-content-light dark:text-content-dark">
            {unreadData?.total ?? 0}
          </Text>
        </Card>

        <Card className="flex-1 p-4 bg-surface-light dark:bg-surface-dark">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-semibold text-muted-light dark:text-muted-dark">
              Online Now
            </Text>
            <Radio size={16} color={tokens.colors.online} />
          </View>
          <Text className="text-2xl font-bold text-content-light dark:text-content-dark">
            {onlineMembers.length}
          </Text>
        </Card>
      </View>

      {/* Continue Chatting Section */}
      <View className="mb-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-base font-bold text-content-light dark:text-content-dark">
            Continue Chatting
          </Text>
          <TouchableOpacity onPress={() => router.push('/(app)/chats')}>
            <View className="flex-row items-center">
              <Text className="text-xs font-semibold text-primary dark:text-primary-light mr-1">
                View all
              </Text>
              <ArrowRight size={14} color={tokens.colors.primary.DEFAULT} />
            </View>
          </TouchableOpacity>
        </View>

        {convLoading ? (
          <View className="space-y-2.5">
            <Skeleton height={68} rounded="lg" />
            <Skeleton height={68} rounded="lg" />
          </View>
        ) : conversations.length === 0 ? (
          <Card className="p-5 items-center justify-center">
            <Text className="text-sm font-semibold text-content-light dark:text-content-dark mb-1">
              No conversations yet
            </Text>
            <Text className="text-xs text-muted-light dark:text-muted-dark text-center mb-4">
              Explore Discover to start an anonymous chat with a verified peer.
            </Text>
            <Button
              title="Explore Discover"
              variant="secondary"
              size="sm"
              icon={<Compass size={16} color={tokens.colors.primary.DEFAULT} />}
              onPress={() => router.push('/(app)/discover')}
              fullWidth={false}
            />
          </Card>
        ) : (
          <View className="space-y-2.5">
            {conversations.map((conv) => (
              <Card
                key={conv.id}
                onPress={() => router.push(`/(app)/chat/${conv.id}`)}
                className="flex-row items-center p-3.5"
              >
                <Avatar
                  color={conv.other.avatarColor}
                  anonUsername={conv.other.anonUsername}
                  size="md"
                  showOnlineStatus
                  isOnline={conv.other.isOnline}
                />
                <View className="flex-1 ml-3 mr-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-bold text-content-light dark:text-content-dark">
                      {conv.other.anonUsername}
                    </Text>
                    {conv.lastMessage?.createdAt && (
                      <Text className="text-xs text-muted-light dark:text-muted-dark">
                        {formatTimeAgo(conv.lastMessage.createdAt)}
                      </Text>
                    )}
                  </View>
                  <Text
                    numberOfLines={1}
                    className="text-xs text-muted-light dark:text-muted-dark mt-1"
                  >
                    {conv.lastMessage ? conv.lastMessage.body : 'No messages yet'}
                  </Text>
                </View>
                {conv.unreadCount > 0 && (
                  <Badge label={conv.unreadCount} variant="primary" size="sm" />
                )}
              </Card>
            ))}
          </View>
        )}
      </View>

      {/* Suggested Online Members */}
      <View className="mb-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-base font-bold text-content-light dark:text-content-dark">
            Online Community Members
          </Text>
          <TouchableOpacity onPress={() => router.push('/(app)/discover')}>
            <Text className="text-xs font-semibold text-primary dark:text-primary-light">
              See more
            </Text>
          </TouchableOpacity>
        </View>

        {onlineLoading ? (
          <View className="flex-row space-x-3">
            <Skeleton width={110} height={120} rounded="lg" />
            <Skeleton width={110} height={120} rounded="lg" />
            <Skeleton width={110} height={120} rounded="lg" />
          </View>
        ) : onlineMembers.length === 0 ? (
          <Card className="p-4 items-center">
            <Text className="text-xs text-muted-light dark:text-muted-dark">
              No other members online right now. Check back soon!
            </Text>
          </Card>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
            {onlineMembers.map((member) => (
              <Card
                key={member.id}
                onPress={() => router.push('/(app)/discover')}
                className="w-28 p-3 items-center mr-3 bg-surface-light dark:bg-surface-dark"
              >
                <Avatar
                  color={member.avatarColor}
                  anonUsername={member.anonUsername}
                  size="md"
                  showOnlineStatus
                  isOnline
                  className="mb-2"
                />
                <Text
                  numberOfLines={1}
                  className="text-xs font-bold text-content-light dark:text-content-dark text-center"
                >
                  {member.anonUsername}
                </Text>
                <Badge
                  label={member.gender === 'female' ? '♀' : '♂'}
                  size="sm"
                  className="mt-1"
                />
              </Card>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Community Safety Reminder Card */}
      <Card className="p-4 mb-8 bg-surface-2-light dark:bg-surface-2-dark border-border-light dark:border-border-dark">
        <View className="flex-row items-center mb-2">
          <ShieldCheck size={18} color={tokens.colors.primary.DEFAULT} />
          <Text className="text-sm font-bold text-content-light dark:text-content-dark ml-2">
            Anonymity & Safety Architecture
          </Text>
        </View>
        <Text className="text-xs text-muted-light dark:text-muted-dark leading-relaxed">
          • Your email and real name are sealed and cannot be accessed by other members.{'\n'}
          • Chat threads are end-to-end isolated. Admins cannot browse chats — only a 30-message snapshot is captured if someone submits a report.{'\n'}
          • Be respectful and follow community guidelines.
        </Text>
      </Card>
    </ScrollView>
  );
}

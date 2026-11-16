import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  MoreVertical,
  Send,
  Check,
  CheckCheck,
  ShieldAlert,
  UserX,
  XCircle,
  Trash2,
  Lock,
} from 'lucide-react-native';
import {
  getMessages,
  sendMessage,
  markConversationRead,
  endConversation,
  deleteConversation,
  reportUser,
} from '@/api/conversations';
import { getConversations } from '@/api/members';
import { blockMember } from '@/api/blocks';
import { Message, Conversation } from '@/types/api';
import { formatTime } from '@/lib/format';
import { formatErrorMessage } from '@/lib/errors';
import {
  Card,
  Avatar,
  Button,
  ConfirmDialog,
  TextField,
} from '@/components/ui';
import {
  subscribeToSocketEvents,
  emitTypingStart,
  emitTypingStop,
} from '@/socket/socketClient';
import { tokens } from '@/theme/tokens';
import { toast } from '@/store/toastStore';

export default function ChatThreadScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [inputText, setInputText] = useState('');
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isEndedLocally, setIsEndedLocally] = useState(false);

  // Modals state
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [endDialogVisible, setEndDialogVisible] = useState(false);
  const [blockDialogVisible, setBlockDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  // Report modal state
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState<
    'spam' | 'harassment' | 'inappropriate' | 'impersonation' | 'other'
  >('harassment');
  const [reportDetails, setReportDetails] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  // Fetch conversation metadata
  const { data: convListData } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => getConversations({ limit: 50 }),
  });

  const conversation = convListData?.items.find((c: Conversation) => c.id === conversationId);
  const otherMember = conversation?.other;
  const isConversationEnded = isEndedLocally || conversation?.status === 'ended';

  // Fetch messages
  const {
    data: messagesData,
    isLoading: messagesLoading,
  } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => getMessages(conversationId!, { limit: 50 }),
    enabled: Boolean(conversationId),
  });

  // Mark messages as read on mount and focus
  const markAsRead = useCallback(async () => {
    if (!conversationId) return;
    try {
      await markConversationRead(conversationId);
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    } catch {
      // safe
    }
  }, [conversationId, queryClient]);

  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  // Subscribe to real-time socket events for this conversation
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = subscribeToSocketEvents({
      onNewMessage: ({ message, conversation: updatedConv }: { message: Message; conversation: Conversation }) => {
        if (message.conversationId === conversationId) {
          queryClient.setQueryData(
            ['messages', conversationId],
            (old: { items: Message[]; nextCursor: string | null } | undefined) => {
              if (!old) return { items: [message], nextCursor: null };
              const filtered = old.items.filter(
                (m) =>
                  m.id !== message.id &&
                  (!message.clientMsgId || m.clientMsgId !== message.clientMsgId)
              );
              return { ...old, items: [message, ...filtered] };
            }
          );
          setOptimisticMessages((prev) =>
            prev.filter((m) => m.clientMsgId !== message.clientMsgId)
          );
          markAsRead();
        }
        if (updatedConv.id === conversationId && updatedConv.status === 'ended') {
          setIsEndedLocally(true);
        }
      },
      onMessageRead: ({ conversationId: convId, readAt }: { conversationId: string; readAt: string }) => {
        if (convId === conversationId) {
          queryClient.setQueryData(
            ['messages', conversationId],
            (old: { items: Message[]; nextCursor: string | null } | undefined) => {
              if (!old) return old;
              return {
                ...old,
                items: old.items.map((m) =>
                  m.mine && !m.readAt ? { ...m, readAt } : m
                ),
              };
            }
          );
        }
      },
      onTyping: ({ conversationId: convId, isTyping }: { conversationId: string; isTyping: boolean }) => {
        if (convId === conversationId) {
          setIsOtherTyping(isTyping);
        }
      },
      onConversationEnded: ({ conversationId: convId }: { conversationId: string }) => {
        if (convId === conversationId) {
          setIsEndedLocally(true);
          toast.info('This conversation has ended.');
        }
      },
    });

    return () => unsubscribe();
  }, [conversationId, queryClient, markAsRead]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: ({ body, clientMsgId }: { body: string; clientMsgId: string }) =>
      sendMessage(conversationId!, body, clientMsgId),
    onSuccess: (sentMsg: Message, variables: { body: string; clientMsgId: string }) => {
      setOptimisticMessages((prev) =>
        prev.filter((m) => m.clientMsgId !== variables.clientMsgId)
      );
      queryClient.setQueryData(
        ['messages', conversationId],
        (old: { items: Message[]; nextCursor: string | null } | undefined) => {
          if (!old) return { items: [sentMsg], nextCursor: null };
          const filtered = old.items.filter((m) => m.id !== sentMsg.id);
          return { ...old, items: [sentMsg, ...filtered] };
        }
      );
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (err: unknown, variables: { body: string; clientMsgId: string }) => {
      setOptimisticMessages((prev) =>
        prev.filter((m) => m.clientMsgId !== variables.clientMsgId)
      );
      toast.error(formatErrorMessage(err));
    },
  });

  const handleSendMessage = () => {
    const text = inputText.trim();
    if (!text || isConversationEnded || sendMutation.isPending) return;

    const clientMsgId = `optimistic-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const optimisticItem: Message = {
      id: clientMsgId,
      conversationId: conversationId!,
      mine: true,
      body: text,
      createdAt: new Date().toISOString(),
      readAt: null,
      clientMsgId,
    };

    setOptimisticMessages((prev) => [optimisticItem, ...prev]);
    setInputText('');
    emitTypingStop(conversationId!);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {
      // safe
    }

    sendMutation.mutate({ body: text, clientMsgId });
  };

  const handleEndConversation = async () => {
    if (!conversationId) return;
    try {
      await endConversation(conversationId);
      setIsEndedLocally(true);
      setEndDialogVisible(false);
      setActionMenuVisible(false);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.info('Conversation ended.');
    } catch (err) {
      toast.error(formatErrorMessage(err));
    }
  };

  const handleBlockMember = async () => {
    if (!otherMember) return;
    try {
      await blockMember(otherMember.id);
      setBlockDialogVisible(false);
      setActionMenuVisible(false);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
      toast.info(`Blocked ${otherMember.anonUsername}`);
      router.replace('/(app)/chats');
    } catch (err) {
      toast.error(formatErrorMessage(err));
    }
  };

  const handleDeleteConversation = async () => {
    if (!conversationId) return;
    try {
      await deleteConversation(conversationId);
      setDeleteDialogVisible(false);
      setActionMenuVisible(false);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.info('Conversation deleted.');
      router.replace('/(app)/chats');
    } catch (err) {
      toast.error(formatErrorMessage(err));
    }
  };

  const handleSubmitReport = async () => {
    if (!otherMember) return;
    setReportLoading(true);
    try {
      await reportUser({
        memberId: otherMember.id,
        conversationId,
        reason: reportReason,
        details: reportDetails,
      });
      setReportModalVisible(false);
      setActionMenuVisible(false);
      setReportDetails('');
      toast.success('Report submitted. A 30-message snapshot has been captured for moderation.');
    } catch (err) {
      toast.error(formatErrorMessage(err));
    } finally {
      setReportLoading(false);
    }
  };

  const handleCopyMessage = async (body: string) => {
    await Clipboard.setStringAsync(body);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {
      // safe
    }
    toast.info('Message copied');
  };

  const serverMessages = messagesData?.items || [];
  const allMessages = [...optimisticMessages, ...serverMessages];

  const renderMessageBubble = ({ item }: { item: Message }) => {
    const isMine = item.mine;
    const isPending = item.id.startsWith('optimistic-');

    return (
      <View
        className={`w-full my-1 flex-row ${
          isMine ? 'justify-end' : 'justify-start'
        }`}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onLongPress={() => handleCopyMessage(item.body)}
          className={`max-w-[78%] px-4 py-2.5 rounded-2xl ${
            isMine
              ? 'bg-primary rounded-tr-sm text-white shadow-sm'
              : 'bg-surface-2-light dark:bg-surface-2-dark rounded-tl-sm border border-border-light dark:border-border-dark'
          }`}
        >
          <Text
            className={`text-base leading-relaxed ${
              isMine ? 'text-white' : 'text-content-light dark:text-content-dark'
            }`}
          >
            {item.body}
          </Text>

          <View
            className={`flex-row items-center justify-end mt-1 space-x-1 ${
              isMine ? 'opacity-90' : 'opacity-60'
            }`}
          >
            <Text
              className={`text-[10px] ${
                isMine ? 'text-white/80' : 'text-muted-light dark:text-muted-dark'
              }`}
            >
              {formatTime(item.createdAt)}
            </Text>

            {isMine && (
              <View className="ml-1">
                {isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : item.readAt ? (
                  <CheckCheck size={13} color="#93C5FD" />
                ) : (
                  <Check size={13} color="#FFFFFF" />
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background-light dark:bg-background-dark"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Thread Header */}
      <View className="pt-12 pb-3 px-4 flex-row items-center justify-between border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-sm">
        <View className="flex-row items-center flex-1 mr-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-9 h-9 items-center justify-center rounded-full bg-surface-2-light dark:bg-surface-2-dark mr-2.5"
          >
            <ArrowLeft size={18} color={tokens.colors.content.dark} />
          </TouchableOpacity>

          <Avatar
            color={otherMember?.avatarColor}
            anonUsername={otherMember?.anonUsername}
            size="md"
            showOnlineStatus
            isOnline={otherMember?.isOnline}
          />

          <View className="ml-3 flex-1">
            <Text
              numberOfLines={1}
              className="text-base font-bold text-content-light dark:text-content-dark"
            >
              {otherMember?.anonUsername || 'Anonymous Member'}
            </Text>
            <Text
              numberOfLines={1}
              className={`text-xs ${
                isOtherTyping
                  ? 'text-primary dark:text-primary-light italic font-semibold'
                  : 'text-muted-light dark:text-muted-dark'
              }`}
            >
              {isOtherTyping
                ? 'typing...'
                : otherMember?.isOnline
                  ? 'Online'
                  : 'Offline'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setActionMenuVisible(true)}
          className="w-9 h-9 items-center justify-center rounded-full bg-surface-2-light dark:bg-surface-2-dark"
          accessibilityLabel="Conversation actions"
        >
          <MoreVertical size={18} color="#8E92B0" />
        </TouchableOpacity>
      </View>

      {/* Screen Privacy Notice Banner */}
      <View className="bg-primary/10 px-4 py-1.5 flex-row items-center justify-center space-x-1 border-b border-primary/20">
        <Lock size={12} color={tokens.colors.primary.DEFAULT} />
        <Text className="text-[11px] font-semibold text-primary dark:text-primary-light ml-1">
          Confidential • Anonymized Chat
        </Text>
      </View>

      {/* Message List */}
      {messagesLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={tokens.colors.primary.DEFAULT} />
        </View>
      ) : (
        <FlatList
          data={allMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageBubble}
          inverted
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center py-12 transform scale-y-[-1]">
              <Text className="text-sm font-semibold text-content-light dark:text-content-dark mb-1">
                Say hello!
              </Text>
              <Text className="text-xs text-muted-light dark:text-muted-dark text-center max-w-xs">
                Your conversation with {otherMember?.anonUsername} is private and anonymous.
              </Text>
            </View>
          }
        />
      )}

      {/* Ended Banner */}
      {isConversationEnded && (
        <View className="bg-surface-2-light dark:bg-surface-2-dark p-3 items-center border-t border-border-light dark:border-border-dark">
          <Text className="text-xs text-muted-light dark:text-muted-dark font-semibold">
            This conversation has ended. No new messages can be sent.
          </Text>
        </View>
      )}

      {/* Message Composer */}
      {!isConversationEnded && (
        <View className="p-3 px-4 flex-row items-end border-t border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
          <View className="flex-1 min-h-[44px] max-h-28 rounded-2xl border border-border-light dark:border-border-dark bg-surface-2-light dark:bg-surface-2-dark px-3.5 py-2 mr-2">
            <TextInput
              value={inputText}
              onChangeText={(text) => {
                if (text.length <= 2000) {
                  setInputText(text);
                  emitTypingStart(conversationId!);
                }
              }}
              placeholder="Send an anonymous message..."
              placeholderTextColor="#8E92B0"
              multiline
              maxLength={2000}
              className="text-base text-content-light dark:text-content-dark py-0"
            />
          </View>

          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!inputText.trim() || sendMutation.isPending}
            className={`w-11 h-11 rounded-2xl items-center justify-center shadow-sm ${
              inputText.trim() && !sendMutation.isPending
                ? 'bg-primary'
                : 'bg-surface-2-light dark:bg-surface-2-dark opacity-50'
            }`}
          >
            {sendMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Action Menu Bottom Modal */}
      <Modal
        visible={actionMenuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setActionMenuVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setActionMenuVisible(false)}
          className="flex-1 justify-end bg-black/60"
        >
          <View className="w-full rounded-t-3xl bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark p-6 pb-8 shadow-2xl">
            <View className="w-12 h-1 rounded-full bg-border-light dark:bg-border-dark self-center mb-6" />

            <Text className="text-lg font-bold text-content-light dark:text-content-dark mb-4">
              Conversation Actions
            </Text>

            <TouchableOpacity
              onPress={() => {
                setActionMenuVisible(false);
                setReportModalVisible(true);
              }}
              className="flex-row items-center py-3.5 border-b border-border-light dark:border-border-dark"
            >
              <ShieldAlert size={20} color={tokens.colors.danger} />
              <View className="ml-3.5">
                <Text className="text-sm font-semibold text-danger">
                  Report Member
                </Text>
                <Text className="text-xs text-muted-light dark:text-muted-dark">
                  Captures a 30-message snapshot for moderation triage
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setActionMenuVisible(false);
                setBlockDialogVisible(true);
              }}
              className="flex-row items-center py-3.5 border-b border-border-light dark:border-border-dark"
            >
              <UserX size={20} color="#F59E0B" />
              <View className="ml-3.5">
                <Text className="text-sm font-semibold text-content-light dark:text-content-dark">
                  Block {otherMember?.anonUsername}
                </Text>
                <Text className="text-xs text-muted-light dark:text-muted-dark">
                  End conversation and prevent future discovery
                </Text>
              </View>
            </TouchableOpacity>

            {!isConversationEnded && (
              <TouchableOpacity
                onPress={() => {
                  setActionMenuVisible(false);
                  setEndDialogVisible(true);
                }}
                className="flex-row items-center py-3.5 border-b border-border-light dark:border-border-dark"
              >
                <XCircle size={20} color="#8E92B0" />
                <View className="ml-3.5">
                  <Text className="text-sm font-semibold text-content-light dark:text-content-dark">
                    End Conversation
                  </Text>
                  <Text className="text-xs text-muted-light dark:text-muted-dark">
                    Disallow new messages for both participants
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => {
                setActionMenuVisible(false);
                setDeleteDialogVisible(true);
              }}
              className="flex-row items-center py-3.5"
            >
              <Trash2 size={20} color="#EF4444" />
              <View className="ml-3.5">
                <Text className="text-sm font-semibold text-danger">
                  Delete Conversation
                </Text>
                <Text className="text-xs text-muted-light dark:text-muted-dark">
                  Remove thread from your conversation list
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* End Conversation Dialog */}
      <ConfirmDialog
        visible={endDialogVisible}
        title="End Conversation"
        message="Are you sure you want to end this conversation? Neither you nor the other member will be able to send further messages in this thread."
        confirmLabel="End Chat"
        cancelLabel="Keep Chatting"
        isDestructive
        onConfirm={handleEndConversation}
        onCancel={() => setEndDialogVisible(false)}
      />

      {/* Block Member Dialog */}
      <ConfirmDialog
        visible={blockDialogVisible}
        title={`Block ${otherMember?.anonUsername}?`}
        message="This will immediately end the conversation and prevent this user from discovering your handle or messaging you again."
        confirmLabel="Block Member"
        cancelLabel="Cancel"
        isDestructive
        onConfirm={handleBlockMember}
        onCancel={() => setBlockDialogVisible(false)}
      />

      {/* Delete Conversation Dialog */}
      <ConfirmDialog
        visible={deleteDialogVisible}
        title="Delete Conversation"
        message="Delete this thread from your chat list? The other participant will retain their history unless they delete it too."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive
        onConfirm={handleDeleteConversation}
        onCancel={() => setDeleteDialogVisible(false)}
      />

      {/* Report Member Modal with 30-message snapshot warning */}
      <Modal
        visible={reportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/75 px-6">
          <View className="w-full max-w-sm rounded-3xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 shadow-2xl">
            <View className="w-12 h-12 rounded-full bg-red-500/20 items-center justify-center mb-3">
              <ShieldAlert size={24} color={tokens.colors.danger} />
            </View>

            <Text className="text-xl font-bold text-content-light dark:text-content-dark mb-1">
              Report Community Member
            </Text>

            <Card className="bg-amber-500/10 border-amber-500/30 p-3 mb-4">
              <Text className="text-xs text-amber-500 font-semibold leading-relaxed">
                Notice: Submitting this report will securely capture the last 30 messages of this conversation for moderation review. Real names and emails remain sealed.
              </Text>
            </Card>

            <Text className="text-xs font-semibold text-content-light dark:text-content-dark mb-2">
              Reason for report
            </Text>

            <View className="flex-row flex-wrap mb-4">
              {(
                [
                  'spam',
                  'harassment',
                  'inappropriate',
                  'impersonation',
                  'other',
                ] as const
              ).map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setReportReason(r)}
                  className={`mr-2 mb-2 px-3 py-1.5 rounded-full border ${
                    reportReason === r
                      ? 'bg-primary border-primary'
                      : 'bg-surface-2-light dark:bg-surface-2-dark border-border-light dark:border-border-dark'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold capitalize ${
                      reportReason === r
                        ? 'text-white'
                        : 'text-content-light dark:text-content-dark'
                    }`}
                  >
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextField
              label="Additional details (Optional)"
              placeholder="Explain the violation..."
              value={reportDetails}
              onChangeText={setReportDetails}
              maxLength={500}
              multiline
            />

            <View className="flex-row space-x-3 mt-2">
              <View className="flex-1">
                <Button
                  title="Cancel"
                  variant="secondary"
                  size="md"
                  onPress={() => setReportModalVisible(false)}
                  disabled={reportLoading}
                />
              </View>
              <View className="flex-1">
                <Button
                  title="Submit Report"
                  variant="danger"
                  size="md"
                  loading={reportLoading}
                  onPress={handleSubmitReport}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

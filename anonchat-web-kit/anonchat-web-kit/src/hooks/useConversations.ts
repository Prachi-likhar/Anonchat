import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { conversationsApi } from '@/api/conversations';
import { blocksApi } from '@/api/blocks';
import { reportsApi, type SubmitReportPayload } from '@/api/reports';
import { getSocket } from '@/lib/socket';
import { playMessageSound } from '@/lib/sound';
import { sendBrowserNotification } from '@/lib/notifications';
import { toast } from '@/store/toastStore';
import { getErrorMessage } from '@/lib/errors';
import type { Conversation, PaginatedResponse, UnreadCountResponse, Message } from '@/types/api';

export function useConversations(limit: number = 20) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const conversationsQuery = useQuery<PaginatedResponse<Conversation>, Error>({
    queryKey: ['conversations', { limit }],
    queryFn: () => conversationsApi.getConversations({ limit }),
    staleTime: 1000 * 15,
  });

  const unreadCountQuery = useQuery<UnreadCountResponse, Error>({
    queryKey: ['unread-count'],
    queryFn: () => conversationsApi.getUnreadCount(),
    staleTime: 1000 * 30,
  });

  // Socket listener for presence and conversation updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handlePresence = (payload: { memberId: string; isOnline: boolean }) => {
      queryClient.setQueriesData<PaginatedResponse<Conversation>>(
        { queryKey: ['conversations'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((c) =>
              c.other.id === payload.memberId
                ? { ...c, other: { ...c.other, isOnline: payload.isOnline } }
                : c,
            ),
          };
        },
      );
    };

    const handleNewMessage = (payload: { message: Message; conversation: Conversation }) => {
      queryClient.setQueriesData<PaginatedResponse<Conversation>>(
        { queryKey: ['conversations'] },
        (old) => {
          if (!old) return old;
          const existing = old.items.find((c) => c.id === payload.conversation.id);
          if (existing) {
            const updated = {
              ...existing,
              lastMessage: {
                id: payload.message.id,
                body: payload.message.body,
                createdAt: payload.message.createdAt,
                mine: payload.message.mine,
              },
              updatedAt: payload.message.createdAt,
              unreadCount: payload.message.mine ? existing.unreadCount : existing.unreadCount + 1,
            };
            return {
              ...old,
              items: [updated, ...old.items.filter((c) => c.id !== payload.conversation.id)],
            };
          }
          return {
            ...old,
            items: [payload.conversation, ...old.items],
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });

      // Trigger incoming message sound and background notification
      if (!payload.message.mine) {
        playMessageSound();
        sendBrowserNotification(
          payload.conversation.other.anonUsername,
          payload.conversation.id,
        );
      }
    };

    const handleConversationEnded = (payload: { conversationId: string }) => {
      queryClient.setQueriesData<PaginatedResponse<Conversation>>(
        { queryKey: ['conversations'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((c) =>
              c.id === payload.conversationId ? { ...c, status: 'ended' } : c,
            ),
          };
        },
      );
    };

    socket.on('presence', handlePresence);
    socket.on('message:new', handleNewMessage);
    socket.on('conversation:ended', handleConversationEnded);

    return () => {
      socket.off('presence', handlePresence);
      socket.off('message:new', handleNewMessage);
      socket.off('conversation:ended', handleConversationEnded);
    };
  }, [queryClient]);

  const startConversationMutation = useMutation({
    mutationFn: (memberId: string) => conversationsApi.startConversation(memberId),
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      navigate(`/app/chat/${conversation.id}`);
    },
    onError: (err) => {
      const msg = getErrorMessage(err);
      toast.error(msg, 'Cannot Start Chat');
    },
  });

  const endConversationMutation = useMutation({
    mutationFn: (conversationId: string) => conversationsApi.endConversation(conversationId),
    onSuccess: (_, conversationId) => {
      queryClient.setQueriesData<PaginatedResponse<Conversation>>(
        { queryKey: ['conversations'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((c) =>
              c.id === conversationId ? { ...c, status: 'ended' } : c,
            ),
          };
        },
      );
      toast.info('Conversation has been ended.', 'Chat Ended');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err), 'Failed to End Chat');
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: (conversationId: string) => conversationsApi.deleteConversation(conversationId),
    onSuccess: (_, conversationId) => {
      queryClient.setQueriesData<PaginatedResponse<Conversation>>(
        { queryKey: ['conversations'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.filter((c) => c.id !== conversationId),
          };
        },
      );
      toast.success('Conversation removed from your list.', 'Chat Deleted');
      navigate('/app/chat');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err), 'Failed to Delete Chat');
    },
  });

  const blockUserMutation = useMutation({
    mutationFn: (memberId: string) => blocksApi.blockUser(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('User blocked. You will no longer receive messages from them.', 'User Blocked');
      navigate('/app/chat');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err), 'Failed to Block User');
    },
  });

  const submitReportMutation = useMutation({
    mutationFn: (payload: SubmitReportPayload) => reportsApi.submitReport(payload),
    onSuccess: () => {
      toast.success(
        'Thank you for reporting. Community moderators will review the recent message snapshot.',
        'Report Submitted',
      );
    },
    onError: (err) => {
      toast.error(getErrorMessage(err), 'Failed to Submit Report');
    },
  });

  return {
    conversations: conversationsQuery.data?.items || [],
    isLoading: conversationsQuery.isLoading,
    isError: conversationsQuery.isError,
    error: conversationsQuery.error,
    refetch: conversationsQuery.refetch,

    unreadCount: unreadCountQuery.data?.total || 0,

    startConversation: startConversationMutation.mutate,
    isStarting: startConversationMutation.isPending,

    endConversation: endConversationMutation.mutate,
    isEnding: endConversationMutation.isPending,

    deleteConversation: deleteConversationMutation.mutate,
    isDeleting: deleteConversationMutation.isPending,

    blockUser: blockUserMutation.mutate,
    isBlocking: blockUserMutation.isPending,

    submitReport: submitReportMutation.mutate,
    isReporting: submitReportMutation.isPending,
  };
}

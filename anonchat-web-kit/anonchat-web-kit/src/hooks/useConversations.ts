import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { conversationsApi } from '@/api/conversations';
import { toast } from '@/store/toastStore';
import { getErrorMessage } from '@/lib/errors';
import type { Conversation, PaginatedResponse, UnreadCountResponse } from '@/types/api';

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

  return {
    conversations: conversationsQuery.data?.items || [],
    isLoading: conversationsQuery.isLoading,
    isError: conversationsQuery.isError,
    error: conversationsQuery.error,
    refetch: conversationsQuery.refetch,

    unreadCount: unreadCountQuery.data?.total || 0,

    startConversation: startConversationMutation.mutate,
    isStarting: startConversationMutation.isPending,
  };
}


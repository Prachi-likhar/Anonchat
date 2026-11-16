import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { conversationsApi } from '@/api/conversations';
import { getSocket, emitTypingStart, emitTypingStop } from '@/lib/socket';
import { toast } from '@/store/toastStore';
import { getErrorMessage, getErrorCode } from '@/lib/errors';
import type { Message, PaginatedResponse, Conversation } from '@/types/api';

export function useChatThread(conversationId: string | undefined) {
  const queryClient = useQueryClient();
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingEmitterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // 1. Fetch messages with infinite query
  const messagesQuery = useInfiniteQuery<PaginatedResponse<Message>, Error>({
    queryKey: ['messages', conversationId],
    queryFn: async ({ pageParam }) => {
      if (!conversationId) {
        return { items: [], nextCursor: null };
      }
      return conversationsApi.getMessages(conversationId, {
        limit: 30,
        before: pageParam as string | undefined,
      });
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!conversationId,
    staleTime: 1000 * 30,
  });

  // Flatten and order messages chronologically (oldest at top, newest at bottom)
  const messages = useMemo(() => {
    if (!messagesQuery.data?.pages) return [];
    const allItems: Message[] = [];
    const seenIds = new Set<string>();

    // Pages are ordered newest to oldest, with items within page newest to oldest
    for (const page of messagesQuery.data.pages) {
      for (const item of page.items) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          allItems.push(item);
        }
      }
    }

    // Sort ascending by createdAt
    return allItems.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [messagesQuery.data]);

  // Mark as read helper
  const markRead = useCallback(async () => {
    if (!conversationId) return;
    try {
      await conversationsApi.markAsRead(conversationId);
      // Invalidate unread-count and update conversation unreadCount in cache
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
      queryClient.setQueriesData<PaginatedResponse<Conversation>>(
        { queryKey: ['conversations'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
          };
        },
      );
    } catch {
      // Non-critical, ignore
    }
  }, [conversationId, queryClient]);

  // Mark as read when entering the thread
  useEffect(() => {
    if (conversationId) {
      markRead();
    }
  }, [conversationId, markRead]);

  // 2. Real-time socket event listeners
  useEffect(() => {
    if (!conversationId) return;

    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (payload: { message: Message; conversation: Conversation }) => {
      if (payload.message.conversationId !== conversationId) return;

      queryClient.setQueryData<{
        pages: PaginatedResponse<Message>[];
        pageParams: (string | undefined)[];
      }>(['messages', conversationId], (oldData) => {
        if (!oldData || oldData.pages.length === 0) {
          return {
            pages: [{ items: [payload.message], nextCursor: null }],
            pageParams: [undefined],
          };
        }

        // Check if message already exists (either by id or clientMsgId)
        const alreadyExists = oldData.pages.some((page) =>
          page.items.some(
            (m) =>
              m.id === payload.message.id ||
              (m.clientMsgId &&
                payload.message.clientMsgId &&
                m.clientMsgId === payload.message.clientMsgId),
          ),
        );

        if (alreadyExists) {
          // Replace temp optimistic message if matched
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              items: page.items.map((m) =>
                m.id === payload.message.id ||
                (m.clientMsgId &&
                  payload.message.clientMsgId &&
                  m.clientMsgId === payload.message.clientMsgId)
                  ? payload.message
                  : m,
              ),
            })),
          };
        }

        // Prepend to the first page (newest messages page)
        const firstPage = oldData.pages[0];
        const updatedFirstPage = {
          ...firstPage,
          items: [payload.message, ...firstPage.items],
        };

        return {
          ...oldData,
          pages: [updatedFirstPage, ...oldData.pages.slice(1)],
        };
      });

      // Update conversations list cache with latest message
      queryClient.setQueriesData<PaginatedResponse<Conversation>>(
        { queryKey: ['conversations'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((c) => {
              if (c.id === conversationId) {
                return {
                  ...c,
                  lastMessage: {
                    id: payload.message.id,
                    body: payload.message.body,
                    createdAt: payload.message.createdAt,
                    mine: payload.message.mine,
                  },
                  updatedAt: payload.message.createdAt,
                  unreadCount: 0,
                };
              }
              return c;
            }),
          };
        },
      );

      // If incoming message from other user while active in thread, mark read
      if (!payload.message.mine) {
        setIsPartnerTyping(false);
        markRead();
      }
    };

    const handleMessageRead = (payload: { conversationId: string; readAt: string }) => {
      if (payload.conversationId !== conversationId) return;

      queryClient.setQueryData<{
        pages: PaginatedResponse<Message>[];
        pageParams: (string | undefined)[];
      }>(['messages', conversationId], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            items: page.items.map((m) =>
              m.mine && !m.readAt ? { ...m, readAt: payload.readAt } : m,
            ),
          })),
        };
      });
    };

    const handleTyping = (payload: { conversationId: string; isTyping: boolean }) => {
      if (payload.conversationId !== conversationId) return;

      setIsPartnerTyping(payload.isTyping);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (payload.isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          setIsPartnerTyping(false);
        }, 3500);
      }
    };

    const handleConversationEnded = (payload: { conversationId: string }) => {
      if (payload.conversationId !== conversationId) return;

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
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:read', handleMessageRead);
    socket.on('typing', handleTyping);
    socket.on('conversation:ended', handleConversationEnded);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:read', handleMessageRead);
      socket.off('typing', handleTyping);
      socket.off('conversation:ended', handleConversationEnded);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, queryClient, markRead]);

  // Rate limit countdown effect
  useEffect(() => {
    if (rateLimitCountdown === null || rateLimitCountdown <= 0) return;
    const interval = setInterval(() => {
      setRateLimitCountdown((prev) => {
        if (prev === null || prev <= 1) return null;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitCountdown]);

  // 3. User typing handler
  const handleUserTyping = useCallback(() => {
    if (!conversationId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      emitTypingStart(conversationId);
    }

    if (typingEmitterTimeoutRef.current) {
      clearTimeout(typingEmitterTimeoutRef.current);
    }

    typingEmitterTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      emitTypingStop(conversationId);
    }, 1500);
  }, [conversationId]);

  const handleStopTyping = useCallback(() => {
    if (!conversationId) return;
    if (typingEmitterTimeoutRef.current) {
      clearTimeout(typingEmitterTimeoutRef.current);
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      emitTypingStop(conversationId);
    }
  }, [conversationId]);

  // 4. Send Message with optimistic UI
  const sendMessage = useCallback(
    async (body: string) => {
      if (!conversationId || !body.trim() || isSending) return;

      const trimmedBody = body.trim();
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const optimisticMsg: Message = {
        id: tempId,
        conversationId,
        mine: true,
        body: trimmedBody,
        createdAt: new Date().toISOString(),
        readAt: null,
        clientMsgId: tempId,
      };

      // Optimistically insert message
      queryClient.setQueryData<{
        pages: PaginatedResponse<Message>[];
        pageParams: (string | undefined)[];
      }>(['messages', conversationId], (oldData) => {
        if (!oldData || oldData.pages.length === 0) {
          return {
            pages: [{ items: [optimisticMsg], nextCursor: null }],
            pageParams: [undefined],
          };
        }

        const firstPage = oldData.pages[0];
        return {
          ...oldData,
          pages: [{ ...firstPage, items: [optimisticMsg, ...firstPage.items] }, ...oldData.pages.slice(1)],
        };
      });

      // Stop typing
      handleStopTyping();
      setIsSending(true);

      try {
        const sentMessage = await conversationsApi.sendMessage(conversationId, {
          body: trimmedBody,
          clientMsgId: tempId,
        });

        // Replace optimistic message with server message
        queryClient.setQueryData<{
          pages: PaginatedResponse<Message>[];
          pageParams: (string | undefined)[];
        }>(['messages', conversationId], (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              items: page.items.map((m) => (m.id === tempId ? sentMessage : m)),
            })),
          };
        });

        // Update conversation in list
        queryClient.setQueriesData<PaginatedResponse<Conversation>>(
          { queryKey: ['conversations'] },
          (old) => {
            if (!old) return old;
            return {
              ...old,
              items: old.items.map((c) => {
                if (c.id === conversationId) {
                  return {
                    ...c,
                    lastMessage: {
                      id: sentMessage.id,
                      body: sentMessage.body,
                      createdAt: sentMessage.createdAt,
                      mine: true,
                    },
                    updatedAt: sentMessage.createdAt,
                  };
                }
                return c;
              }),
            };
          },
        );
      } catch (err: unknown) {
        // Rollback optimistic message on failure
        queryClient.setQueryData<{
          pages: PaginatedResponse<Message>[];
          pageParams: (string | undefined)[];
        }>(['messages', conversationId], (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              items: page.items.filter((m) => m.id !== tempId),
            })),
          };
        });

        const code = getErrorCode(err);
        const msg = getErrorMessage(err);

        if (code === 'RATE_LIMIT_EXCEEDED') {
          setRateLimitCountdown(10);
          toast.error('You are sending messages too quickly. Please slow down.', 'Rate Limit');
        } else if (code === 'CONVERSATION_ENDED') {
          toast.error('This conversation has ended and no further messages can be sent.', 'Chat Ended');
        } else if (code === 'USER_BLOCKED') {
          toast.error('Cannot send message because one of you has blocked the other.', 'User Blocked');
        } else {
          toast.error(msg, 'Failed to Send');
        }
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, isSending, queryClient, handleStopTyping],
  );

  return {
    messages,
    isLoading: messagesQuery.isLoading,
    isError: messagesQuery.isError,
    error: messagesQuery.error,
    isFetchingNextPage: messagesQuery.isFetchingNextPage,
    hasNextPage: !!messagesQuery.hasNextPage,
    fetchNextPage: messagesQuery.fetchNextPage,
    sendMessage,
    isSending,
    isPartnerTyping,
    handleUserTyping,
    handleStopTyping,
    rateLimitCountdown,
  };
}


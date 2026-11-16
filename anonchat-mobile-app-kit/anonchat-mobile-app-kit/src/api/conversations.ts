import { api } from './client';
import { Message, PaginatedResponse } from '../types/api';

export async function getMessages(
  conversationId: string,
  params?: { limit?: number; before?: string }
): Promise<PaginatedResponse<Message>> {
  const res = await api.get<PaginatedResponse<Message>>(
    `/conversations/${conversationId}/messages`,
    {
      params: {
        limit: params?.limit || 30,
        before: params?.before || undefined,
      },
    }
  );
  return res.data;
}

export async function sendMessage(
  conversationId: string,
  body: string,
  clientMsgId?: string
): Promise<Message> {
  const res = await api.post<Message>(
    `/conversations/${conversationId}/messages`,
    {
      body: body.trim(),
      clientMsgId,
    }
  );
  return res.data;
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await api.post(`/conversations/${conversationId}/read`);
}

export async function endConversation(conversationId: string): Promise<void> {
  await api.post(`/conversations/${conversationId}/end`);
}

export async function deleteConversation(conversationId: string): Promise<void> {
  await api.delete(`/conversations/${conversationId}`);
}

export async function reportUser(payload: {
  memberId: string;
  conversationId?: string;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'impersonation' | 'other';
  details?: string;
}): Promise<{ id: string }> {
  const res = await api.post<{ id: string }>('/reports', {
    memberId: payload.memberId,
    conversationId: payload.conversationId,
    reason: payload.reason,
    details: payload.details?.trim() || undefined,
  });
  return res.data;
}

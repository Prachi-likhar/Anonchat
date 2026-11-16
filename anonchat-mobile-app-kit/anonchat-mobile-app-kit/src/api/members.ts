import { api } from './client';
import { PublicMember, Conversation, PaginatedResponse } from '../types/api';

export async function getMembers(params?: {
  filter?: 'all' | 'male' | 'female' | 'online';
  search?: string;
  cursor?: string;
  limit?: number;
}): Promise<PaginatedResponse<PublicMember>> {
  const res = await api.get<PaginatedResponse<PublicMember>>('/members', {
    params: {
      filter: params?.filter || 'all',
      search: params?.search?.trim() || undefined,
      cursor: params?.cursor || undefined,
      limit: params?.limit || 20,
    },
  });
  return res.data;
}

export async function startConversation(memberId: string): Promise<Conversation> {
  const res = await api.post<Conversation>('/conversations', { memberId });
  return res.data;
}

export async function getConversations(params?: {
  cursor?: string;
  limit?: number;
}): Promise<PaginatedResponse<Conversation>> {
  const res = await api.get<PaginatedResponse<Conversation>>('/conversations', {
    params: {
      cursor: params?.cursor || undefined,
      limit: params?.limit || 20,
    },
  });
  return res.data;
}

export async function getUnreadCount(): Promise<{ total: number }> {
  const res = await api.get<{ total: number }>('/unread-count');
  return res.data;
}

import { apiClient } from './client';
import type { Conversation, Message, PaginatedResponse, UnreadCountResponse } from '@/types/api';

export interface GetConversationsParams {
  limit?: number;
  cursor?: string;
}

export interface GetMessagesParams {
  limit?: number;
  before?: string;
}

export interface SendMessagePayload {
  body: string;
  clientMsgId?: string;
}

export const conversationsApi = {
  async startConversation(memberId: string): Promise<Conversation> {
    const res = await apiClient.post<Conversation>('/conversations', { memberId });
    return res.data;
  },

  async getConversations(
    params?: GetConversationsParams,
  ): Promise<PaginatedResponse<Conversation>> {
    const res = await apiClient.get<PaginatedResponse<Conversation>>('/conversations', { params });
    return res.data;
  },

  async getMessages(
    conversationId: string,
    params?: GetMessagesParams,
  ): Promise<PaginatedResponse<Message>> {
    const res = await apiClient.get<PaginatedResponse<Message>>(
      `/conversations/${conversationId}/messages`,
      { params },
    );
    return res.data;
  },

  async sendMessage(conversationId: string, data: SendMessagePayload): Promise<Message> {
    const res = await apiClient.post<Message>(`/conversations/${conversationId}/messages`, data);
    return res.data;
  },

  async markAsRead(conversationId: string): Promise<void> {
    await apiClient.post(`/conversations/${conversationId}/read`, {});
  },

  async endConversation(conversationId: string): Promise<void> {
    await apiClient.post(`/conversations/${conversationId}/end`, {});
  },

  async deleteConversation(conversationId: string): Promise<void> {
    await apiClient.delete(`/conversations/${conversationId}`);
  },

  async getUnreadCount(): Promise<UnreadCountResponse> {
    const res = await apiClient.get<UnreadCountResponse>('/unread-count');
    return res.data;
  },
};

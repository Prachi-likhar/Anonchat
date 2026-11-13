import { apiClient } from './client';
import type { PublicMember, PaginatedResponse } from '@/types/api';

export interface GetMembersParams {
  filter?: 'all' | 'male' | 'female' | 'online';
  search?: string;
  limit?: number;
  cursor?: string;
}

export const membersApi = {
  async getMembers(params?: GetMembersParams): Promise<PaginatedResponse<PublicMember>> {
    const res = await apiClient.get<PaginatedResponse<PublicMember>>('/members', { params });
    return res.data;
  },
};

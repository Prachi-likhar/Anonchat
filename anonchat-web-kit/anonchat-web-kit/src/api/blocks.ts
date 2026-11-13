import { apiClient } from './client';
import type { PublicMember } from '@/types/api';

export const blocksApi = {
  async blockUser(memberId: string): Promise<void> {
    await apiClient.post('/blocks', { memberId });
  },

  async unblockUser(memberId: string): Promise<void> {
    await apiClient.delete(`/blocks/${memberId}`);
  },

  async getBlockedUsers(): Promise<{ items: PublicMember[] }> {
    const res = await apiClient.get<{ items: PublicMember[] }>('/blocks');
    return res.data;
  },
};

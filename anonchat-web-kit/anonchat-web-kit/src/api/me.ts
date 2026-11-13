import { apiClient } from './client';
import type { Me, Gender, UserTheme } from '@/types/api';

export interface UpdateMePayload {
  fullName?: string;
  gender?: Gender;
  avatarColor?: string;
  theme?: UserTheme;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const meApi = {
  async getMe(): Promise<Me> {
    const res = await apiClient.get<Me>('/me');
    return res.data;
  },

  async updateMe(data: UpdateMePayload): Promise<Me> {
    const res = await apiClient.patch<Me>('/me', data);
    return res.data;
  },

  async changePassword(data: ChangePasswordPayload): Promise<void> {
    await apiClient.post('/me/change-password', data);
  },

  async deleteAccount(password: string): Promise<void> {
    await apiClient.delete('/me', { data: { password } });
  },
};

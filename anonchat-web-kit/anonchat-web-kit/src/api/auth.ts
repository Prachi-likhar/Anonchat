import { apiClient } from './client';
import type {
  Gender,
  RegisterResponse,
  AuthSuccessResponse,
  RefreshTokenResponse,
  MessageResponse,
} from '@/types/api';

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  gender: Gender;
}

export interface VerifyEmailPayload {
  email: string;
  otp: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

export const authApi = {
  async register(data: RegisterPayload): Promise<RegisterResponse> {
    const res = await apiClient.post<RegisterResponse>('/auth/register', data);
    return res.data;
  },

  async verifyEmail(data: VerifyEmailPayload): Promise<AuthSuccessResponse> {
    const res = await apiClient.post<AuthSuccessResponse>('/auth/verify-email', data);
    return res.data;
  },

  async resendOtp(email: string): Promise<MessageResponse> {
    const res = await apiClient.post<MessageResponse>('/auth/resend-otp', { email });
    return res.data;
  },

  async login(data: LoginPayload): Promise<AuthSuccessResponse> {
    const res = await apiClient.post<AuthSuccessResponse>('/auth/login', data);
    return res.data;
  },

  async refresh(): Promise<RefreshTokenResponse> {
    const res = await apiClient.post<RefreshTokenResponse>('/auth/refresh', {});
    return res.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout', {});
  },

  async forgotPassword(email: string): Promise<MessageResponse> {
    const res = await apiClient.post<MessageResponse>('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(data: ResetPasswordPayload): Promise<MessageResponse> {
    const res = await apiClient.post<MessageResponse>('/auth/reset-password', data);
    return res.data;
  },
};

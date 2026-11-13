import { apiClient } from './client';
import type {
  AdminStats,
  AdminUser,
  ReportItem,
  ReportDetail,
  AdminActivityItem,
  PaginatedResponse,
  UserRole,
} from '@/types/api';

export interface GetAdminUsersParams {
  status?: string;
  gender?: string;
  q?: string;
  limit?: number;
  cursor?: string;
}

export interface GetAdminReportsParams {
  status?: string;
  limit?: number;
  cursor?: string;
}

export interface SuspendUserPayload {
  until: string;
  reason: string;
}

export interface BanUserPayload {
  reason: string;
}

export interface UpdateReportPayload {
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  resolutionNote?: string;
  action?: 'none' | 'suspend' | 'ban';
}

export const adminApi = {
  async getStats(): Promise<AdminStats> {
    const res = await apiClient.get<AdminStats>('/admin/stats');
    return res.data;
  },

  async getUsers(params?: GetAdminUsersParams): Promise<PaginatedResponse<AdminUser>> {
    const res = await apiClient.get<PaginatedResponse<AdminUser>>('/admin/users', { params });
    return res.data;
  },

  async getUserDetail(id: string): Promise<
    AdminUser & {
      reportsAgainst?: ReportItem[];
      auditEntries?: AdminActivityItem[];
    }
  > {
    const res = await apiClient.get<
      AdminUser & {
        reportsAgainst?: ReportItem[];
        auditEntries?: AdminActivityItem[];
      }
    >(`/admin/users/${id}`);
    return res.data;
  },

  async suspendUser(id: string, data: SuspendUserPayload): Promise<void> {
    await apiClient.post(`/admin/users/${id}/suspend`, data);
  },

  async banUser(id: string, data: BanUserPayload): Promise<void> {
    await apiClient.post(`/admin/users/${id}/ban`, data);
  },

  async reinstateUser(id: string): Promise<void> {
    await apiClient.post(`/admin/users/${id}/reinstate`, {});
  },

  async changeUserRole(id: string, data: { role: UserRole }): Promise<void> {
    await apiClient.post(`/admin/users/${id}/role`, data);
  },

  async getReports(params?: GetAdminReportsParams): Promise<PaginatedResponse<ReportItem>> {
    const res = await apiClient.get<PaginatedResponse<ReportItem>>('/admin/reports', { params });
    return res.data;
  },

  async getReportDetail(id: string): Promise<ReportDetail> {
    const res = await apiClient.get<ReportDetail>(`/admin/reports/${id}`);
    return res.data;
  },

  async updateReport(id: string, data: UpdateReportPayload): Promise<ReportDetail> {
    const res = await apiClient.patch<ReportDetail>(`/admin/reports/${id}`, data);
    return res.data;
  },

  async getActivity(params?: {
    limit?: number;
    cursor?: string;
  }): Promise<PaginatedResponse<AdminActivityItem>> {
    const res = await apiClient.get<PaginatedResponse<AdminActivityItem>>('/admin/activity', {
      params,
    });
    return res.data;
  },

  async getOnlineUsers(): Promise<{ items: AdminUser[] }> {
    const res = await apiClient.get<{ items: AdminUser[] }>('/admin/online');
    return res.data;
  },
};

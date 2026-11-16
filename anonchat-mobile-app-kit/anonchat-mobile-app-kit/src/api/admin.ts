import { api } from './client';
import {
  AdminStats,
  AdminUser,
  AdminReport,
  PaginatedResponse,
  Message,
} from '../types/api';

export async function getAdminStats(): Promise<AdminStats> {
  const res = await api.get<AdminStats>('/admin/stats');
  return res.data;
}

export async function getAdminUsers(params?: {
  status?: string;
  gender?: string;
  q?: string;
  cursor?: string;
  limit?: number;
}): Promise<PaginatedResponse<AdminUser>> {
  const res = await api.get<PaginatedResponse<AdminUser>>('/admin/users', {
    params: {
      status: params?.status || undefined,
      gender: params?.gender || undefined,
      q: params?.q?.trim() || undefined,
      cursor: params?.cursor || undefined,
      limit: params?.limit || 20,
    },
  });
  return res.data;
}

export interface AdminUserDetail extends AdminUser {
  recentReports?: any[];
  auditEntries?: any[];
}

export async function getAdminUser(id: string): Promise<AdminUserDetail> {
  const res = await api.get<AdminUserDetail>(`/admin/users/${id}`);
  return res.data;
}

export async function suspendUser(
  id: string,
  until: string,
  reason: string
): Promise<void> {
  await api.post(`/admin/users/${id}/suspend`, { until, reason });
}

export async function banUser(id: string, reason: string): Promise<void> {
  await api.post(`/admin/users/${id}/ban`, { reason });
}

export async function reinstateUser(id: string): Promise<void> {
  await api.post(`/admin/users/${id}/reinstate`);
}

export async function getAdminReports(params?: {
  status?: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  cursor?: string;
  limit?: number;
}): Promise<PaginatedResponse<AdminReport>> {
  const res = await api.get<PaginatedResponse<AdminReport>>('/admin/reports', {
    params: {
      status: params?.status || undefined,
      cursor: params?.cursor || undefined,
      limit: params?.limit || 20,
    },
  });
  return res.data;
}

export interface AdminReportDetail extends AdminReport {
  snapshot?: {
    messages: Message[];
  };
}

export async function getAdminReport(id: string): Promise<AdminReportDetail> {
  const res = await api.get<AdminReportDetail>(`/admin/reports/${id}`);
  return res.data;
}

export async function resolveReport(
  id: string,
  payload: {
    status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
    resolutionNote?: string;
    action?: 'none' | 'suspend' | 'ban';
  }
): Promise<AdminReport> {
  const res = await api.patch<AdminReport>(`/admin/reports/${id}`, payload);
  return res.data;
}

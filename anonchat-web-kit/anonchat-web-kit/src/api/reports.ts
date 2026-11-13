import { apiClient } from './client';
import type { ReportReason } from '@/types/api';

export interface SubmitReportPayload {
  memberId: string;
  conversationId?: string;
  reason: ReportReason;
  details?: string;
}

export const reportsApi = {
  async submitReport(data: SubmitReportPayload): Promise<{ id: string }> {
    const res = await apiClient.post<{ id: string }>('/reports', data);
    return res.data;
  },
};

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Routes, Route, MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminRoute } from '@/routes/AdminRoute';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminUsers } from '@/pages/admin/AdminUsers';
import { AdminReports } from '@/pages/admin/AdminReports';
import { AdminActivity } from '@/pages/admin/AdminActivity';
import { adminApi } from '@/api/admin';
import { useAuthStore } from '@/store/authStore';
import type { AdminStats, AdminUser, ReportItem, ReportDetail, AdminActivityItem } from '@/types/api';

vi.mock('@/api/admin', () => ({
  adminApi: {
    getStats: vi.fn(),
    getUsers: vi.fn(),
    getUserDetail: vi.fn(),
    suspendUser: vi.fn(),
    banUser: vi.fn(),
    reinstateUser: vi.fn(),
    getReports: vi.fn(),
    getReportDetail: vi.fn(),
    updateReport: vi.fn(),
    getActivity: vi.fn(),
  },
}));

const mockStats: AdminStats = {
  totalUsers: 142,
  male: 80,
  female: 62,
  onlineNow: 28,
  newToday: 14,
  new7d: 56,
  suspended: 3,
  banned: 1,
  openReports: 2,
  messagesToday: 480,
  conversationsActive: 34,
};

const mockAdminUser: AdminUser = {
  id: 'u-1',
  anonUsername: 'Anonymous_4821',
  email: 'alex@example.com',
  gender: 'female',
  status: 'active',
  role: 'user',
  isOnline: true,
  reportCount: 1,
  createdAt: new Date().toISOString(),
  lastSeenAt: new Date().toISOString(),
  suspendedUntil: null,
};

const mockSuspendedUser: AdminUser = {
  ...mockAdminUser,
  id: 'u-2',
  anonUsername: 'Anonymous_9999',
  email: 'spammer@example.com',
  status: 'suspended',
  reportCount: 4,
};

const mockReport: ReportItem = {
  id: 'rep-1',
  reporterId: 'u-reporter',
  reportedUserId: 'u-reported',
  conversationId: 'c-1',
  reason: 'harassment',
  details: 'Targeted abusive messages sent repeatedly',
  status: 'open',
  resolutionNote: null,
  createdAt: new Date().toISOString(),
  reporterAnonName: 'Anonymous_1001',
  reportedAnonName: 'Anonymous_9999',
};

const mockReportDetail: ReportDetail = {
  ...mockReport,
  snapshotMessages: [
    {
      id: 'm-1',
      conversationId: 'c-1',
      mine: false,
      body: 'Inappropriate message line 1',
      createdAt: new Date().toISOString(),
      readAt: null,
    },
  ],
};

const mockActivity: AdminActivityItem = {
  id: 'act-1',
  adminId: 'adm-1',
  action: 'user_suspended',
  targetType: 'user',
  targetId: 'u-2',
  details: { reason: 'Abuse of rules' },
  ipAddress: '192.168.1.1',
  createdAt: new Date().toISOString(),
};

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>,
  );
}

describe('Phase 6: Admin Portal, Metrics & Moderation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      isAuthenticated: true,
      isLoading: false,
      user: {
        id: 'admin-1',
        anonUsername: 'Anonymous_0001',
        fullName: 'Admin User',
        email: 'admin@anonchat.internal',
        gender: 'male',
        avatarColor: '#7C3AED',
        role: 'admin',
        theme: 'system',
        createdAt: new Date().toISOString(),
      },
    });
  });

  describe('AdminRoute Protection', () => {
    it('shows Access Denied when non-admin user attempts to access /admin', () => {
      useAuthStore.setState({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'user-regular',
          anonUsername: 'Anonymous_8888',
          fullName: 'Regular User',
          email: 'user@example.com',
          gender: 'female',
          avatarColor: '#EC4899',
          role: 'user',
          theme: 'system',
          createdAt: new Date().toISOString(),
        },
      });

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<div>Admin Secret Area</div>} />
            </Route>
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
      expect(screen.queryByText(/admin secret area/i)).not.toBeInTheDocument();
    });

    it('allows access when user role is admin', () => {
      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<div>Admin Secret Area</div>} />
            </Route>
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText(/admin secret area/i)).toBeInTheDocument();
    });
  });

  describe('AdminDashboard', () => {
    it('renders KPI metrics and demographic breakdowns', async () => {
      vi.mocked(adminApi.getStats).mockResolvedValue(mockStats);
      vi.mocked(adminApi.getReports).mockResolvedValue({ items: [mockReport], nextCursor: null });
      vi.mocked(adminApi.getActivity).mockResolvedValue({ items: [mockActivity], nextCursor: null });

      renderWithClient(<AdminDashboard />);

      expect(await screen.findByText('142')).toBeInTheDocument();
      expect(screen.getByText('28 online')).toBeInTheDocument();
      expect(screen.getByText(/open reports/i)).toBeInTheDocument();
      expect(screen.getByText(/active chats/i)).toBeInTheDocument();
      expect(screen.getByText(/community gender split/i)).toBeInTheDocument();
      expect(screen.getByText(/requires review/i)).toBeInTheDocument();
    });
  });

  describe('AdminUsers', () => {
    it('renders user directory and performs moderation actions', async () => {
      vi.mocked(adminApi.getUsers).mockResolvedValue({
        items: [mockAdminUser, mockSuspendedUser],
        nextCursor: null,
      });
      vi.mocked(adminApi.suspendUser).mockResolvedValue(undefined);
      vi.mocked(adminApi.reinstateUser).mockResolvedValue(undefined);

      renderWithClient(<AdminUsers />);

      expect(await screen.findByText('Anonymous_4821')).toBeInTheDocument();
      expect(screen.getByText('alex@example.com')).toBeInTheDocument();
      expect(screen.getByText('Anonymous_9999')).toBeInTheDocument();

      // Click suspend button on active user
      const suspendBtn = screen.getByLabelText(/suspend anonymous_4821/i);
      fireEvent.click(suspendBtn);

      expect(screen.getByText(/suspend anonymous_4821/i)).toBeInTheDocument();
      const reasonInput = screen.getByPlaceholderText(/describe reason for suspension/i);
      await userEvent.type(reasonInput, 'Spamming members');

      const submitSuspendBtn = screen.getByRole('button', { name: /confirm suspension/i });
      fireEvent.click(submitSuspendBtn);

      await waitFor(() => {
        expect(adminApi.suspendUser).toHaveBeenCalledWith('u-1', expect.objectContaining({
          reason: 'Spamming members',
        }));
      });
    });
  });

  describe('AdminReports', () => {
    it('renders report list, inspects snapshot, and resolves report', async () => {
      vi.mocked(adminApi.getReports).mockResolvedValue({
        items: [mockReport],
        nextCursor: null,
      });
      vi.mocked(adminApi.getReportDetail).mockResolvedValue(mockReportDetail);
      vi.mocked(adminApi.updateReport).mockResolvedValue(mockReportDetail);

      renderWithClient(<AdminReports />);

      expect(await screen.findByText('Anonymous_9999')).toBeInTheDocument();
      expect(screen.getByText(/harassment/i)).toBeInTheDocument();

      // Click Inspect
      const inspectBtn = screen.getByRole('button', { name: /inspect/i });
      fireEvent.click(inspectBtn);

      expect(await screen.findByText(/report investigation & snapshot/i)).toBeInTheDocument();
      expect(await screen.findByText(/inappropriate message line 1/i)).toBeInTheDocument();

      // Resolve report
      const resolveBtn = screen.getByRole('button', { name: /resolve & apply/i });
      fireEvent.click(resolveBtn);

      await waitFor(() => {
        expect(adminApi.updateReport).toHaveBeenCalledWith('rep-1', expect.objectContaining({
          status: 'resolved',
        }));
      });
    });
  });

  describe('AdminActivity', () => {
    it('renders audit activity stream with filter badges', async () => {
      vi.mocked(adminApi.getActivity).mockResolvedValue({
        items: [mockActivity],
        nextCursor: null,
      });

      renderWithClient(<AdminActivity />);

      expect(await screen.findByText('user_suspended')).toBeInTheDocument();
      expect(screen.getByText(/192\.168\.1\.1/)).toBeInTheDocument();
      expect(screen.getByText(/filter action:/i)).toBeInTheDocument();
    });
  });
});

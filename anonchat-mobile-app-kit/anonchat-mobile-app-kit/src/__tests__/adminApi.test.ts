import {
  getAdminStats,
  getAdminUsers,
  getAdminUser,
  suspendUser,
  banUser,
  reinstateUser,
  getAdminReports,
  getAdminReport,
  resolveReport,
} from '../api/admin';
import { api } from '../api/client';

jest.mock('../api/client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

describe('Admin API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stats', () => {
    it('fetches admin KPI stats', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({
        data: {
          totalUsers: 100,
          conversationsActive: 25,
          openReports: 3,
          onlineNow: 15,
        },
      });

      const stats = await getAdminStats();
      expect(api.get).toHaveBeenCalledWith('/admin/stats');
      expect(stats.totalUsers).toBe(100);
      expect(stats.openReports).toBe(3);
    });
  });

  describe('Users moderation', () => {
    it('queries users with filters', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({
        data: {
          items: [{ id: 'u-1', anonUsername: 'Anonymous_1001' }],
          nextCursor: null,
        },
      });

      const res = await getAdminUsers({ status: 'suspended', q: '1001' });
      expect(api.get).toHaveBeenCalledWith('/admin/users', {
        params: { status: 'suspended', gender: undefined, q: '1001', cursor: undefined, limit: 20 },
      });
      expect(res.items.length).toBe(1);
    });

    it('fetches single user detail', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({
        data: { id: 'u-1', anonUsername: 'Anonymous_1001', role: 'user' },
      });

      const user = await getAdminUser('u-1');
      expect(api.get).toHaveBeenCalledWith('/admin/users/u-1');
      expect(user.anonUsername).toBe('Anonymous_1001');
    });

    it('suspends a user with timestamp and reason', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({ status: 204 });
      await suspendUser('u-1', '2026-11-20T00:00:00Z', 'Spamming');
      expect(api.post).toHaveBeenCalledWith('/admin/users/u-1/suspend', {
        until: '2026-11-20T00:00:00Z',
        reason: 'Spamming',
      });
    });

    it('permanently bans a user with reason', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({ status: 204 });
      await banUser('u-1', 'Severe harassment');
      expect(api.post).toHaveBeenCalledWith('/admin/users/u-1/ban', {
        reason: 'Severe harassment',
      });
    });

    it('reinstates a user', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({ status: 204 });
      await reinstateUser('u-1');
      expect(api.post).toHaveBeenCalledWith('/admin/users/u-1/reinstate');
    });
  });

  describe('Reports triage and resolution', () => {
    it('queries reports with status', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({
        data: {
          items: [{ id: 'r-1', reason: 'harassment', status: 'open' }],
          nextCursor: null,
        },
      });

      const res = await getAdminReports({ status: 'open' });
      expect(api.get).toHaveBeenCalledWith('/admin/reports', {
        params: { status: 'open', cursor: undefined, limit: 20 },
      });
      expect(res.items.length).toBe(1);
    });

    it('fetches single report detail with snapshot', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({
        data: {
          id: 'r-1',
          snapshot: { messages: [{ id: 'm-1', body: 'Harassing text' }] },
        },
      });

      const rep = await getAdminReport('r-1');
      expect(api.get).toHaveBeenCalledWith('/admin/reports/r-1');
      expect(rep.snapshot?.messages.length).toBe(1);
    });

    it('resolves a report with note and action', async () => {
      (api.patch as jest.Mock).mockResolvedValueOnce({
        data: { id: 'r-1', status: 'resolved' },
      });

      const res = await resolveReport('r-1', {
        status: 'resolved',
        action: 'suspend',
        resolutionNote: 'Suspended for 7 days',
      });

      expect(api.patch).toHaveBeenCalledWith('/admin/reports/r-1', {
        status: 'resolved',
        action: 'suspend',
        resolutionNote: 'Suspended for 7 days',
      });
      expect(res.status).toBe('resolved');
    });
  });
});

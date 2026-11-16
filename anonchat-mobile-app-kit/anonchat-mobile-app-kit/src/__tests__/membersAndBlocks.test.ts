import { getMembers, startConversation, getUnreadCount, getConversations } from '../api/members';
import { getBlockedMembers, blockMember, unblockMember } from '../api/blocks';
import { api } from '../api/client';

jest.mock('../api/client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Members and Blocks API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMembers', () => {
    it('requests members with expected query filters', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({
        data: {
          items: [
            {
              id: 'm-1',
              anonUsername: 'Anonymous_1001',
              gender: 'male',
              avatarColor: '#7C3AED',
              isOnline: true,
            },
          ],
          nextCursor: null,
        },
      });

      const res = await getMembers({ filter: 'online', search: '1001', limit: 20 });
      expect(api.get).toHaveBeenCalledWith('/members', {
        params: {
          filter: 'online',
          search: '1001',
          cursor: undefined,
          limit: 20,
        },
      });
      expect(res.items.length).toBe(1);
      expect(res.items[0].anonUsername).toBe('Anonymous_1001');
    });
  });

  describe('startConversation', () => {
    it('calls POST /conversations with memberId', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: {
          id: 'c-123',
          other: { id: 'm-1', anonUsername: 'Anonymous_1001' },
          status: 'active',
        },
      });

      const conv = await startConversation('m-1');
      expect(api.post).toHaveBeenCalledWith('/conversations', { memberId: 'm-1' });
      expect(conv.id).toBe('c-123');
    });
  });

  describe('getConversations', () => {
    it('requests conversations with cursor and limit', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({
        data: {
          items: [{ id: 'conv-1' }],
          nextCursor: 'cur-2',
        },
      });

      const res = await getConversations({ limit: 10, cursor: 'cur-1' });
      expect(api.get).toHaveBeenCalledWith('/conversations', {
        params: { cursor: 'cur-1', limit: 10 },
      });
      expect(res.items.length).toBe(1);
    });
  });

  describe('getUnreadCount', () => {
    it('calls GET /unread-count', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({ data: { total: 4 } });
      const res = await getUnreadCount();
      expect(api.get).toHaveBeenCalledWith('/unread-count');
      expect(res.total).toBe(4);
    });
  });

  describe('Blocks API', () => {
    it('fetches blocked members', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({
        data: {
          items: [{ id: 'b-1', anonUsername: 'Anonymous_9999' }],
        },
      });
      const res = await getBlockedMembers();
      expect(api.get).toHaveBeenCalledWith('/blocks');
      expect(res.items.length).toBe(1);
    });

    it('blocks a member', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({ status: 204 });
      await blockMember('target-id');
      expect(api.post).toHaveBeenCalledWith('/blocks', { memberId: 'target-id' });
    });

    it('unblocks a member', async () => {
      (api.delete as jest.Mock).mockResolvedValueOnce({ status: 204 });
      await unblockMember('target-id');
      expect(api.delete).toHaveBeenCalledWith('/blocks/target-id');
    });
  });
});

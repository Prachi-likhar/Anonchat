import {
  getMessages,
  sendMessage,
  markConversationRead,
  endConversation,
  deleteConversation,
  reportUser,
} from '../api/conversations';
import { api } from '../api/client';
import {
  connectSocket,
  emitTypingStart,
  emitTypingStop,
  subscribeToSocketEvents,
} from '../socket/socketClient';

jest.mock('../api/client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
  getAccessToken: jest.fn(() => 'mock-jwt-token'),
}));

jest.mock('socket.io-client', () => {
  const eventMap: Record<string, ((...args: any[]) => void)[]> = {};

  const mockSocket = {
    connected: true,
    auth: {},
    connect: jest.fn(),
    disconnect: jest.fn(),
    emit: jest.fn(),
    on: jest.fn((event: string, handler: (...args: any[]) => void) => {
      if (!eventMap[event]) eventMap[event] = [];
      eventMap[event].push(handler);
    }),
    off: jest.fn((event: string, handler: (...args: any[]) => void) => {
      if (eventMap[event]) {
        eventMap[event] = eventMap[event].filter((h) => h !== handler);
      }
    }),
    __trigger: (event: string, ...args: any[]) => {
      if (eventMap[event]) {
        eventMap[event].forEach((h) => h(...args));
      }
    },
  };

  return {
    io: jest.fn(() => mockSocket),
  };
});

describe('Conversations API and Socket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMessages', () => {
    it('requests messages with limit and cursor', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({
        data: {
          items: [{ id: 'm-1', body: 'Hello', mine: false }],
          nextCursor: 'cur-2',
        },
      });

      const res = await getMessages('conv-123', { limit: 25, before: 'cur-1' });
      expect(api.get).toHaveBeenCalledWith('/conversations/conv-123/messages', {
        params: { limit: 25, before: 'cur-1' },
      });
      expect(res.items.length).toBe(1);
    });
  });

  describe('sendMessage', () => {
    it('posts new message with clientMsgId', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: {
          id: 'm-2',
          conversationId: 'conv-123',
          body: 'Hello back',
          mine: true,
        },
      });

      const msg = await sendMessage('conv-123', 'Hello back', 'client-uuid-1');
      expect(api.post).toHaveBeenCalledWith('/conversations/conv-123/messages', {
        body: 'Hello back',
        clientMsgId: 'client-uuid-1',
      });
      expect(msg.body).toBe('Hello back');
    });
  });

  describe('Lifecycle endpoints', () => {
    it('marks conversation read', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({ status: 204 });
      await markConversationRead('conv-123');
      expect(api.post).toHaveBeenCalledWith('/conversations/conv-123/read');
    });

    it('ends conversation', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({ status: 204 });
      await endConversation('conv-123');
      expect(api.post).toHaveBeenCalledWith('/conversations/conv-123/end');
    });

    it('deletes conversation', async () => {
      (api.delete as jest.Mock).mockResolvedValueOnce({ status: 204 });
      await deleteConversation('conv-123');
      expect(api.delete).toHaveBeenCalledWith('/conversations/conv-123/delete' ? '/conversations/conv-123' : '');
    });

    it('submits user report with snapshot payload', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({ data: { id: 'rep-1' } });
      const res = await reportUser({
        memberId: 'm-other',
        conversationId: 'conv-123',
        reason: 'harassment',
        details: 'Offensive conduct',
      });
      expect(api.post).toHaveBeenCalledWith('/reports', {
        memberId: 'm-other',
        conversationId: 'conv-123',
        reason: 'harassment',
        details: 'Offensive conduct',
      });
      expect(res.id).toBe('rep-1');
    });
  });

  describe('Socket real-time', () => {
    it('connects and receives new messages', () => {
      const onNewMessage = jest.fn();
      const unsubscribe = subscribeToSocketEvents({ onNewMessage });

      const socket = connectSocket();
      (socket as any).__trigger('message:new', {
        message: { id: 'm-new', body: 'Live msg' },
        conversation: { id: 'c-1' },
      });

      expect(onNewMessage).toHaveBeenCalledWith({
        message: { id: 'm-new', body: 'Live msg' },
        conversation: { id: 'c-1' },
      });

      unsubscribe();
    });

    it('emits typing events', () => {
      const socket = connectSocket();
      emitTypingStart('conv-123');
      expect(socket.emit).toHaveBeenCalledWith('typing:start', {
        conversationId: 'conv-123',
      });

      emitTypingStop('conv-123');
      expect(socket.emit).toHaveBeenCalledWith('typing:stop', {
        conversationId: 'conv-123',
      });
    });
  });
});

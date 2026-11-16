import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import type {
  SocketNewMessagePayload,
  SocketMessageReadPayload,
  SocketTypingPayload,
  SocketPresencePayload,
  SocketConversationEndedPayload,
  SocketForceLogoutPayload,
} from '@/types/api';

export interface ServerToClientEvents {
  'message:new': (payload: SocketNewMessagePayload) => void;
  'message:read': (payload: SocketMessageReadPayload) => void;
  typing: (payload: SocketTypingPayload) => void;
  presence: (payload: SocketPresencePayload) => void;
  'conversation:ended': (payload: SocketConversationEndedPayload) => void;
  'force-logout': (payload: SocketForceLogoutPayload) => void;
}

export interface ClientToServerEvents {
  'typing:start': (payload: { conversationId: string }) => void;
  'typing:stop': (payload: { conversationId: string }) => void;
}

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socketInstance: TypedSocket | null = null;
let currentToken: string | null = null;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export function getSocket(): TypedSocket | null {
  return socketInstance;
}

export function connectSocket(token: string): TypedSocket {
  if (socketInstance && currentToken === token && socketInstance.connected) {
    return socketInstance;
  }

  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }

  currentToken = token;

  socketInstance = io(SOCKET_URL, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    autoConnect: true,
    auth: {
      token,
    },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socketInstance.on('force-logout', ({ reason }) => {
    // Clear user authentication and redirect if forced out by admin
    useAuthStore.getState().clearAuth();
    if (reason === 'banned') {
      window.location.href = '/login?error=ACCOUNT_BANNED';
    } else if (reason === 'suspended') {
      window.location.href = '/login?error=ACCOUNT_SUSPENDED';
    } else {
      window.location.href = '/login';
    }
  });

  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    currentToken = null;
  }
}

export function emitTypingStart(conversationId: string): void {
  if (socketInstance?.connected) {
    socketInstance.emit('typing:start', { conversationId });
  }
}

export function emitTypingStop(conversationId: string): void {
  if (socketInstance?.connected) {
    socketInstance.emit('typing:stop', { conversationId });
  }
}


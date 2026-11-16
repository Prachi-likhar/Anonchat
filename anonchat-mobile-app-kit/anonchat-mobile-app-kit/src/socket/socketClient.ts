import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import { getAccessToken } from '../api/client';
import { Message, Conversation } from '../types/api';

const DEFAULT_SOCKET_URL = Platform.select({
  android: 'http://10.0.2.2:4000',
  default: 'http://localhost:4000',
});

export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || DEFAULT_SOCKET_URL;

let socket: Socket | null = null;
let lastTypingTime = 0;
let typingTimeout: NodeJS.Timeout | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket {
  const token = getAccessToken();
  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  socket = io(SOCKET_URL, {
    path: '/socket.io',
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    // connected
  });

  socket.on('connect_error', (_err) => {
    // will auto-retry
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function reconnectWithToken(token: string): void {
  if (socket) {
    socket.auth = { token };
    if (!socket.connected) {
      socket.connect();
    }
  } else {
    connectSocket();
  }
}

export function emitTypingStart(conversationId: string): void {
  if (!socket?.connected) return;
  const now = Date.now();
  if (now - lastTypingTime > 2000) {
    socket.emit('typing:start', { conversationId });
    lastTypingTime = now;
  }

  if (typingTimeout) clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    emitTypingStop(conversationId);
  }, 4000);
}

export function emitTypingStop(conversationId: string): void {
  if (!socket?.connected) return;
  socket.emit('typing:stop', { conversationId });
  if (typingTimeout) {
    clearTimeout(typingTimeout);
    typingTimeout = null;
  }
}

export interface SocketEventsListener {
  onNewMessage?: (payload: { message: Message; conversation: Conversation }) => void;
  onMessageRead?: (payload: { conversationId: string; readAt: string }) => void;
  onTyping?: (payload: { conversationId: string; isTyping: boolean }) => void;
  onPresence?: (payload: { memberId: string; isOnline: boolean }) => void;
  onConversationEnded?: (payload: { conversationId: string }) => void;
  onForceLogout?: (payload: { reason: string }) => void;
}

export function subscribeToSocketEvents(listeners: SocketEventsListener): () => void {
  const currentSocket = connectSocket();

  const handleNewMessage = (payload: { message: Message; conversation: Conversation }) => {
    listeners.onNewMessage?.(payload);
  };

  const handleMessageRead = (payload: { conversationId: string; readAt: string }) => {
    listeners.onMessageRead?.(payload);
  };

  const handleTyping = (payload: { conversationId: string; isTyping: boolean }) => {
    listeners.onTyping?.(payload);
  };

  const handlePresence = (payload: { memberId: string; isOnline: boolean }) => {
    listeners.onPresence?.(payload);
  };

  const handleEnded = (payload: { conversationId: string }) => {
    listeners.onConversationEnded?.(payload);
  };

  const handleForceLogout = (payload: { reason: string }) => {
    listeners.onForceLogout?.(payload);
  };

  currentSocket.on('message:new', handleNewMessage);
  currentSocket.on('message:read', handleMessageRead);
  currentSocket.on('typing', handleTyping);
  currentSocket.on('presence', handlePresence);
  currentSocket.on('conversation:ended', handleEnded);
  currentSocket.on('force-logout', handleForceLogout);

  return () => {
    currentSocket.off('message:new', handleNewMessage);
    currentSocket.off('message:read', handleMessageRead);
    currentSocket.off('typing', handleTyping);
    currentSocket.off('presence', handlePresence);
    currentSocket.off('conversation:ended', handleEnded);
    currentSocket.off('force-logout', handleForceLogout);
  };
}

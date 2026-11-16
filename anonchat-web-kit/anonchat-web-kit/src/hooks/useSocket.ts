import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';

export function useSocket() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [isConnected, setIsConnected] = useState<boolean>(() => {
    const s = getSocket();
    return !!s?.connected;
  });

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      disconnectSocket();
      setIsConnected(false);
      return;
    }

    const socket = connectSocket(accessToken);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [isAuthenticated, accessToken]);

  return {
    socket: getSocket(),
    isConnected,
  };
}


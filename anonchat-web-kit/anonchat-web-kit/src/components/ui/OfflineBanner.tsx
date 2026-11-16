import React, { useState, useEffect, useRef } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/authStore';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [showBackOnline, setShowBackOnline] = useState(false);
  const { isConnected } = useSocket();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const prevConnectedRef = useRef(isConnected);
  const prevOnlineRef = useRef(isOnline);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Detect reconnection to show brief "Back online" green notification
  useEffect(() => {
    const wasOfflineOrDisconnected =
      !prevOnlineRef.current || (!prevConnectedRef.current && isAuthenticated);
    const isNowFullyOnline = isOnline && (isConnected || !isAuthenticated);

    if (wasOfflineOrDisconnected && isNowFullyOnline) {
      setShowBackOnline(true);
      const timer = setTimeout(() => setShowBackOnline(false), 3000);
      return () => clearTimeout(timer);
    }

    prevOnlineRef.current = isOnline;
    prevConnectedRef.current = isConnected;
  }, [isOnline, isConnected, isAuthenticated]);

  if (!isOnline) {
    return (
      <div
        role="alert"
        className="bg-danger/90 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm z-50 select-none animate-in fade-in"
      >
        <WifiOff className="h-4 w-4 shrink-0" />
        <span>You are currently offline. Check your internet connection.</span>
      </div>
    );
  }

  if (isAuthenticated && !isConnected) {
    return (
      <div
        role="alert"
        className="bg-amber-500/90 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm z-50 select-none animate-in fade-in"
      >
        <RefreshCw className="h-3.5 w-3.5 shrink-0 animate-spin" />
        <span>Reconnecting to real-time chat...</span>
      </div>
    );
  }

  if (showBackOnline) {
    return (
      <div
        role="status"
        className="bg-online text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm z-50 select-none animate-in fade-in duration-200"
      >
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span>Back online. Real-time updates active.</span>
      </div>
    );
  }

  return null;
};

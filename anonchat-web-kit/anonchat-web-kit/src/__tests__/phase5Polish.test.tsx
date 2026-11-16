import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { useTitleBadge } from '@/hooks/useTitleBadge';
import { isSoundEnabled, setSoundEnabled, playMessageSound, testSound } from '@/lib/sound';
import {
  isNotificationEnabled,
  setNotificationEnabled,
  sendBrowserNotification,
} from '@/lib/notifications';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { useAuthStore } from '@/store/authStore';

// Mock socket hook
vi.mock('@/hooks/useSocket', () => ({
  useSocket: vi.fn(() => ({ isConnected: true, socket: null })),
}));

import { useSocket } from '@/hooks/useSocket';

describe('Phase 5: Real-Time Polish & Notifications', () => {
  beforeEach(() => {
    localStorage.clear();
    document.title = 'Anonchat';
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.title = 'Anonchat';
  });

  describe('useTitleBadge', () => {
    it('prepends unread count to document title when unread > 0', () => {
      const { rerender } = renderHook(({ count }) => useTitleBadge(count, 'Anonchat'), {
        initialProps: { count: 0 },
      });

      expect(document.title).toBe('Anonchat');

      rerender({ count: 4 });
      expect(document.title).toBe('(4) Anonchat');

      rerender({ count: 12 });
      expect(document.title).toBe('(12) Anonchat');

      rerender({ count: 0 });
      expect(document.title).toBe('Anonchat');
    });
  });

  describe('Audio Sound Chime', () => {
    it('persists sound preferences in localStorage and executes safely', () => {
      expect(isSoundEnabled()).toBe(true); // default true

      setSoundEnabled(false);
      expect(isSoundEnabled()).toBe(false);

      setSoundEnabled(true);
      expect(isSoundEnabled()).toBe(true);

      // Verify safe execution without throwing
      expect(() => playMessageSound()).not.toThrow();
      expect(() => testSound()).not.toThrow();
    });
  });

  describe('Browser Push Notifications (Strict Privacy)', () => {
    it('enforces privacy: never leaks message content in notifications', () => {
      const mockNotification = vi.fn();
      vi.stubGlobal('Notification', mockNotification);

      // Define permission
      Object.defineProperty(Notification, 'permission', {
        value: 'granted',
        writable: true,
      });

      setNotificationEnabled(true);
      expect(isNotificationEnabled()).toBe(true);

      // Stub document visibility to hidden
      vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');

      sendBrowserNotification('Anonymous_9812', 'conv-xyz');

      expect(mockNotification).toHaveBeenCalledWith('Anonchat', {
        body: 'New message from Anonymous_9812',
        icon: '/favicon.ico',
        tag: 'chat-conv-xyz',
      });

      // Strict privacy check: ensure NO email or message body appears
      const passedOptions = mockNotification.mock.calls[0][1];
      expect(passedOptions.body).not.toMatch(/@/);
      expect(passedOptions.body).not.toMatch(/hello|secret|password|private/i);
    });

    it('does not send notification when tab is currently visible', () => {
      const mockNotification = vi.fn();
      vi.stubGlobal('Notification', mockNotification);
      setNotificationEnabled(true);

      vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');

      sendBrowserNotification('Anonymous_9812');
      expect(mockNotification).not.toHaveBeenCalled();
    });
  });

  describe('OfflineBanner', () => {
    it('renders offline alert when navigator.onLine is false', () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

      render(<OfflineBanner />);

      expect(
        screen.getByText(/you are currently offline\. check your internet connection\./i),
      ).toBeInTheDocument();
    });

    it('renders reconnecting alert when online but socket is disconnected', () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
      (useSocket as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isConnected: false,
        socket: null,
      });

      // Mock user authenticated
      act(() => {
        useAuthStore.setState({
          isAuthenticated: true,
          accessToken: 'test-token',
        });
      });

      render(<OfflineBanner />);

      expect(screen.getByText(/reconnecting to real-time chat\.\.\./i)).toBeInTheDocument();
    });

    it('renders nothing when online and socket is connected', () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
      (useSocket as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isConnected: true,
        socket: null,
      });

      const { container } = render(<OfflineBanner />);
      expect(container.firstChild).toBeNull();
    });
  });
});

/**
 * HTML5 Background Push Notifications
 * Strict privacy rule: Never displays message text or real identity.
 * Only fires when tab is hidden.
 */

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function isNotificationEnabled(): boolean {
  if (!isNotificationSupported()) return false;
  return (
    localStorage.getItem('anonchat_notifications') === 'true' &&
    Notification.permission === 'granted'
  );
}

export function setNotificationEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('anonchat_notifications', String(enabled));
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    setNotificationEnabled(granted);
    return granted;
  } catch {
    return false;
  }
}

export function sendBrowserNotification(
  senderPseudonym: string,
  conversationId?: string,
): void {
  // Only notify when tab is hidden and user enabled notifications
  if (
    typeof document === 'undefined' ||
    document.visibilityState !== 'hidden' ||
    !isNotificationEnabled()
  ) {
    return;
  }

  try {
    const title = 'Anonchat';
    const options: NotificationOptions = {
      body: `New message from ${senderPseudonym}`,
      icon: '/favicon.ico',
      tag: conversationId ? `chat-${conversationId}` : 'anonchat-msg',
    };

    const notification = new Notification(title, options);

    notification.onclick = () => {
      window.focus();
      if (conversationId && window.location.pathname !== `/app/chat/${conversationId}`) {
        window.location.href = `/app/chat/${conversationId}`;
      }
      notification.close();
    };
  } catch {
    // Non-fatal notification error
  }
}

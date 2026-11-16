import { useEffect } from 'react';

export function useTitleBadge(unreadCount: number, baseTitle: string = 'Anonchat') {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (unreadCount > 0) {
      document.title = `(${unreadCount}) ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }

    return () => {
      document.title = baseTitle;
    };
  }, [unreadCount, baseTitle]);
}

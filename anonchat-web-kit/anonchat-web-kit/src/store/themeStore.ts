import { create } from 'zustand';
import type { UserTheme } from '@/types/api';

interface ThemeState {
  theme: UserTheme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: UserTheme) => void;
  initTheme: () => void;
}

const STORAGE_KEY = 'anonchat_theme';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(resolvedTheme: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (resolvedTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'system',
  resolvedTheme: 'dark',

  setTheme: (theme: UserTheme) => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // storage unavailable
    }

    const resolved = theme === 'system' ? getSystemTheme() : theme;
    applyTheme(resolved);
    set({ theme, resolvedTheme: resolved });
  },

  initTheme: () => {
    let savedTheme: UserTheme = 'system';
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        savedTheme = stored;
      }
    } catch {
      // ignore
    }

    const resolved = savedTheme === 'system' ? getSystemTheme() : savedTheme;
    applyTheme(resolved);
    set({ theme: savedTheme, resolvedTheme: resolved });

    // Listen to OS changes when in system mode
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) => {
        if (get().theme === 'system') {
          const newResolved = e.matches ? 'dark' : 'light';
          applyTheme(newResolved);
          set({ resolvedTheme: newResolved });
        }
      };
      mediaQuery.addEventListener('change', listener);
    }
  },
}));

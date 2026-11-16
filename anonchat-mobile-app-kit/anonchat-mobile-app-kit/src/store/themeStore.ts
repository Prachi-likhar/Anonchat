import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode } from '../theme/tokens';
import { api } from '../api/client';

const THEME_STORAGE_KEY = 'anonchat_user_theme';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode, syncWithBackend?: boolean) => Promise<void>;
  loadStoredTheme: () => Promise<ThemeMode>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'system',

  setTheme: async (mode: ThemeMode, syncWithBackend = false) => {
    set({ theme: mode });
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // non-fatal
    }
    if (syncWithBackend) {
      try {
        await api.patch('/me', { theme: mode }).catch(() => {});
      } catch {
        // non-fatal
      }
    }
  },

  loadStoredTheme: async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        set({ theme: stored });
        return stored;
      }
    } catch {
      // fallback
    }
    return 'system';
  },
}));

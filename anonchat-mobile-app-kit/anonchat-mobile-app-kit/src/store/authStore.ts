import { create } from 'zustand';
import { Me } from '../types/api';
import { api, setAccessToken as setApiAccessToken, onSessionExpired } from '../api/client';
import { getRefreshToken, setRefreshToken, deleteRefreshToken } from '../lib/secureStorage';

interface AuthState {
  user: Me | null;
  accessToken: string | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  error: string | null;
  setAuth: (user: Me, accessToken: string, refreshToken?: string) => Promise<void>;
  updateUser: (patch: Partial<Me>) => void;
  logout: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  status: 'idle',
  error: null,

  setAuth: async (user: Me, accessToken: string, refreshToken?: string) => {
    setApiAccessToken(accessToken);
    if (refreshToken) {
      await setRefreshToken(refreshToken);
    }
    set({
      user,
      accessToken,
      status: 'authenticated',
      error: null,
    });
  },

  updateUser: (patch: Partial<Me>) => {
    const current = get().user;
    if (!current) return;
    set({
      user: { ...current, ...patch },
    });
  },

  logout: async () => {
    try {
      const storedToken = await getRefreshToken();
      if (storedToken) {
        await api.post('/auth/logout', { refreshToken: storedToken }).catch(() => {});
      }
    } catch {
      // ignore network errors on logout
    } finally {
      setApiAccessToken(null);
      await deleteRefreshToken();
      set({
        user: null,
        accessToken: null,
        status: 'unauthenticated',
        error: null,
      });
    }
  },

  restoreSession: async () => {
    set({ status: 'loading' });
    try {
      const storedRefreshToken = await getRefreshToken();
      if (!storedRefreshToken) {
        set({ status: 'unauthenticated', user: null, accessToken: null });
        return false;
      }

      // Single refresh call to acquire fresh access token
      const res = await api.post('/auth/refresh', { refreshToken: storedRefreshToken });
      const { accessToken, refreshToken: newRefreshToken, user: returnedUser } = res.data;

      if (!accessToken) {
        throw new Error('No access token returned from refresh');
      }

      setApiAccessToken(accessToken);
      if (newRefreshToken) {
        await setRefreshToken(newRefreshToken);
      }

      let profileUser = returnedUser;
      if (!profileUser) {
        const meRes = await api.get<Me>('/me');
        profileUser = meRes.data;
      }

      set({
        user: profileUser,
        accessToken,
        status: 'authenticated',
        error: null,
      });
      return true;
    } catch {
      setApiAccessToken(null);
      await deleteRefreshToken();
      set({
        user: null,
        accessToken: null,
        status: 'unauthenticated',
      });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));

// Register session expiration handler to update store state immediately
onSessionExpired(() => {
  useAuthStore.setState({
    user: null,
    accessToken: null,
    status: 'unauthenticated',
    error: 'Your session has expired. Please log in again.',
  });
});

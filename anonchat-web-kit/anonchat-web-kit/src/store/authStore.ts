import { create } from 'zustand';
import type { Me } from '@/types/api';

interface AuthState {
  user: Me | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  setAuth: (user: Me, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: Me) => void;
  clearAuth: () => void;
  setLoading: (isLoading: boolean) => void;
  setInitialized: (isInitialized: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,

  setAuth: (user: Me, accessToken: string) =>
    set({
      user,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
      isInitialized: true,
    }),

  setAccessToken: (accessToken: string) =>
    set({
      accessToken,
      isAuthenticated: true,
    }),

  setUser: (user: Me) =>
    set({
      user,
    }),

  clearAuth: () =>
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true,
    }),

  setLoading: (isLoading: boolean) =>
    set({
      isLoading,
    }),

  setInitialized: (isInitialized: boolean) =>
    set({
      isInitialized,
    }),
}));

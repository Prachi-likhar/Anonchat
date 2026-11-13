import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from '@/routes/router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { authApi } from '@/api/auth';
import { meApi } from '@/api/me';
import { ToastContainer } from '@/components/ui/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60, // 1 minute
    },
  },
});

export const App: React.FC = () => {
  const { setAuth, clearAuth, initTheme } = useThemeStore((themeState) => ({
    initTheme: themeState.initTheme,
    setAuth: useAuthStore.getState().setAuth,
    clearAuth: useAuthStore.getState().clearAuth,
  }));

  useEffect(() => {
    // 1. Initialize theme from localStorage or system preference
    initTheme();

    // 2. Silent bootstrap of user session on boot via httpOnly refresh cookie
    const bootstrapSession = async () => {
      try {
        const refreshRes = await authApi.refresh();
        if (refreshRes.accessToken) {
          useAuthStore.getState().setAccessToken(refreshRes.accessToken);
          const me = await meApi.getMe();
          setAuth(me, refreshRes.accessToken);
        } else {
          clearAuth();
        }
      } catch {
        // Not logged in or expired refresh token
        clearAuth();
      }
    };

    bootstrapSession();
  }, [initTheme, setAuth, clearAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ToastContainer />
    </QueryClientProvider>
  );
};

export default App;

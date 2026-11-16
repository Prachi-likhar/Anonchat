import '../global.css';
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../src/store/authStore';
import { useThemeStore } from '../src/store/themeStore';
import { ToastContainer } from '../src/components/ui/Toast';
import { OfflineBanner } from '../src/components/ui/OfflineBanner';
import { tokens } from '../src/theme/tokens';

// Keep the splash screen visible while loading resources
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const { status, restoreSession } = useAuthStore();
  const { theme, loadStoredTheme } = useThemeStore();

  useEffect(() => {
    async function initialize() {
      await loadStoredTheme();
      await restoreSession();
      if (fontsLoaded) {
        await SplashScreen.hideAsync().catch(() => {});
      }
    }
    initialize();
  }, [fontsLoaded, loadStoredTheme, restoreSession]);

  if (!fontsLoaded || status === 'idle' || status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-background-dark">
        <ActivityIndicator size="large" color={tokens.colors.primary.DEFAULT} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <View className="flex-1 bg-background-light dark:bg-background-dark">
        <StatusBar style={theme === 'light' ? 'dark' : 'light'} />
        <OfflineBanner />
        <ToastContainer />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
          <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        </Stack>
      </View>
    </QueryClientProvider>
  );
}

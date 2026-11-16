import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Home, Compass, MessageSquare, User } from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { tokens } from '../../src/theme/tokens';
import { useThemeStore } from '../../src/store/themeStore';

export default function AppLayout() {
  const { status } = useAuthStore();
  const { theme } = useThemeStore();

  if (status === 'unauthenticated') {
    return <Redirect href="/(auth)/welcome" />;
  }

  const isDark = theme !== 'light';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.colors.primary.DEFAULT,
        tabBarInactiveTintColor: isDark ? tokens.colors.muted.dark : tokens.colors.muted.light,
        tabBarStyle: {
          backgroundColor: isDark ? '#161827' : '#FFFFFF',
          borderTopColor: isDark ? '#2A2D45' : '#E4E6F0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => <Compass size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, size }) => <MessageSquare size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat/[id]"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="blocked"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

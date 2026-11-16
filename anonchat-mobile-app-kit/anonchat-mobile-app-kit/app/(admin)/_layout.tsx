import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

export default function AdminLayout() {
  const { user, status } = useAuthStore();

  if (status === 'unauthenticated' || (status === 'authenticated' && user?.role !== 'admin')) {
    return <Redirect href="/(app)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#161827' },
        headerTintColor: '#ECEDF7',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Admin Overview' }} />
      <Stack.Screen name="users" options={{ title: 'User Management' }} />
      <Stack.Screen name="user/[id]" options={{ title: 'User Details' }} />
      <Stack.Screen name="reports" options={{ title: 'Reports Triage' }} />
      <Stack.Screen name="report/[id]" options={{ title: 'Report Snapshot' }} />
    </Stack>
  );
}

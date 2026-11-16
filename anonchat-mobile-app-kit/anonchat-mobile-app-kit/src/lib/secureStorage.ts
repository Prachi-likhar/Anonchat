import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const REFRESH_TOKEN_KEY = 'anonchat_refresh_token';

// In-memory fallback for environments where SecureStore isn't available (like web / node test runners)
let memoryRefreshToken: string | null = null;

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

export async function getRefreshToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return memoryRefreshToken;
  }
  try {
    const isAvailable = await SecureStore.isAvailableAsync();
    if (isAvailable) {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY, secureStoreOptions);
    }
  } catch {
    // fallback to memory
  }
  return memoryRefreshToken;
}

export async function setRefreshToken(token: string): Promise<void> {
  memoryRefreshToken = token;
  if (Platform.OS === 'web') {
    return;
  }
  try {
    const isAvailable = await SecureStore.isAvailableAsync();
    if (isAvailable) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token, secureStoreOptions);
    }
  } catch {
    // memory holds it
  }
}

export async function deleteRefreshToken(): Promise<void> {
  memoryRefreshToken = null;
  if (Platform.OS === 'web') {
    return;
  }
  try {
    const isAvailable = await SecureStore.isAvailableAsync();
    if (isAvailable) {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY, secureStoreOptions);
    }
  } catch {
    // memory cleared
  }
}

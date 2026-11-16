// Mock expo-secure-store in-memory for testing
const mockSecureStoreMap = new Map();

jest.mock('expo-secure-store', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  getItemAsync: jest.fn().mockImplementation(async (key) => mockSecureStoreMap.get(key) ?? null),
  setItemAsync: jest.fn().mockImplementation(async (key, value) => {
    mockSecureStoreMap.set(key, value);
  }),
  deleteItemAsync: jest.fn().mockImplementation(async (key) => {
    mockSecureStoreMap.delete(key);
  }),
  AFTER_FIRST_UNLOCK: 1,
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn().mockResolvedValue({ isConnected: true }),
}));

// Mock Expo Haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// Mock Expo Clipboard
jest.mock('expo-clipboard', () => ({
  getStringAsync: jest.fn().mockResolvedValue(''),
  setStringAsync: jest.fn().mockResolvedValue(true),
}));

// Reset secure store between tests
beforeEach(() => {
  mockSecureStoreMap.clear();
});

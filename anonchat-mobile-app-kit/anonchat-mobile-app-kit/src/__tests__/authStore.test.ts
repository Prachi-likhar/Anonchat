import { useAuthStore } from '../store/authStore';
import { getRefreshToken, setRefreshToken } from '../lib/secureStorage';
import { api } from '../api/client';
import { Me } from '../types/api';

jest.mock('../api/client', () => {
  let mockAccessToken: string | null = null;

  return {
    api: {
      post: jest.fn(),
      get: jest.fn(),
    },
    setAccessToken: jest.fn((token) => {
      mockAccessToken = token;
    }),
    getAccessToken: jest.fn(() => mockAccessToken),
    onSessionExpired: jest.fn(),
    API_BASE_URL: 'http://localhost:4000/api',
  };
});

const mockUser: Me = {
  id: 'u-123',
  anonUsername: 'Anonymous_4821',
  fullName: 'Private User',
  email: 'user@example.com',
  gender: 'female',
  avatarColor: '#7C3AED',
  role: 'user',
  theme: 'dark',
  createdAt: new Date().toISOString(),
};

describe('useAuthStore', () => {
  beforeEach(async () => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      status: 'unauthenticated',
      error: null,
    });
    jest.clearAllMocks();
  });

  it('sets authentication state correctly with access and refresh tokens', async () => {
    await useAuthStore.getState().setAuth(mockUser, 'mock-access-token', 'mock-refresh-token');

    const state = useAuthStore.getState();
    expect(state.status).toBe('authenticated');
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe('mock-access-token');

    const storedRefresh = await getRefreshToken();
    expect(storedRefresh).toBe('mock-refresh-token');
  });

  it('updates user profile partially', () => {
    useAuthStore.setState({ user: mockUser, status: 'authenticated' });
    useAuthStore.getState().updateUser({ avatarColor: '#EC4899', gender: 'male' });

    const updated = useAuthStore.getState().user;
    expect(updated?.avatarColor).toBe('#EC4899');
    expect(updated?.gender).toBe('male');
    expect(updated?.anonUsername).toBe('Anonymous_4821'); // username never changes
  });

  it('clears state on logout', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({ status: 204 });
    await useAuthStore.getState().setAuth(mockUser, 'access-tok', 'refresh-tok');

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.status).toBe('unauthenticated');
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();

    const storedRefresh = await getRefreshToken();
    expect(storedRefresh).toBeNull();
  });

  it('restores session when stored refresh token exists', async () => {
    await setRefreshToken('valid-refresh-token');

    (api.post as jest.Mock).mockResolvedValueOnce({
      data: {
        accessToken: 'new-fresh-access-token',
        refreshToken: 'rotated-refresh-token',
        user: mockUser,
      },
    });

    const success = await useAuthStore.getState().restoreSession();
    expect(success).toBe(true);

    const state = useAuthStore.getState();
    expect(state.status).toBe('authenticated');
    expect(state.accessToken).toBe('new-fresh-access-token');
    expect(state.user?.anonUsername).toBe('Anonymous_4821');

    const storedRefresh = await getRefreshToken();
    expect(storedRefresh).toBe('rotated-refresh-token');
  });
});

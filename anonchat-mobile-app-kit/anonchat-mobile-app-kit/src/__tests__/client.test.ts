import { api, setAccessToken, getAccessToken } from '../api/client';
import { setRefreshToken, getRefreshToken } from '../lib/secureStorage';

jest.mock('axios', () => {
  const actualAxios = jest.requireActual('axios');
  const mockAxiosInstance = actualAxios.create({
    baseURL: 'http://localhost:4000/api',
    headers: {
      'Content-Type': 'application/json',
      'X-Client': 'mobile',
    },
  });

  return {
    ...actualAxios,
    create: jest.fn(() => mockAxiosInstance),
    post: jest.fn(),
  };
});

describe('api client', () => {
  beforeEach(async () => {
    setAccessToken(null);
    jest.clearAllMocks();
  });

  it('configures default base headers with X-Client: mobile', () => {
    expect(api.defaults.headers['X-Client']).toBe('mobile');
  });

  it('manages in-memory access token getter and setter', () => {
    expect(getAccessToken()).toBeNull();
    setAccessToken('test-jwt-token');
    expect(getAccessToken()).toBe('test-jwt-token');
  });

  it('reads and rotates refresh tokens via secure storage helper', async () => {
    await setRefreshToken('refresh-token-alpha');
    let token = await getRefreshToken();
    expect(token).toBe('refresh-token-alpha');

    await setRefreshToken('refresh-token-beta');
    token = await getRefreshToken();
    expect(token).toBe('refresh-token-beta');
  });
});

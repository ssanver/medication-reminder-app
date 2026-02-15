import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loginWithSocial } from './social-auth';

const { promptAsyncMock, makeRedirectUriMock, isAppleAvailableMock, appleSignInMock } = vi.hoisted(() => ({
  promptAsyncMock: vi.fn(),
  makeRedirectUriMock: vi.fn(() => 'medication-reminder://oauth2redirect'),
  isAppleAvailableMock: vi.fn(),
  appleSignInMock: vi.fn(),
}));

vi.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: vi.fn(),
}));

vi.mock('expo-auth-session', () => ({
  makeRedirectUri: makeRedirectUriMock,
  AuthRequest: class {
    promptAsync = promptAsyncMock;
  },
}));

vi.mock('expo-apple-authentication', () => ({
  isAvailableAsync: isAppleAvailableMock,
  signInAsync: appleSignInMock,
  AppleAuthenticationScope: {
    FULL_NAME: 0,
    EMAIL: 1,
  },
}));

describe('loginWithSocial', () => {
  beforeEach(() => {
    vi.stubEnv('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', 'google-client-id');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    promptAsyncMock.mockReset();
    isAppleAvailableMock.mockReset();
    appleSignInMock.mockReset();
  });

  it('google flow sonrasi apiye token gonderir', async () => {
    promptAsyncMock.mockResolvedValue({
      type: 'success',
      params: { id_token: 'google-id-token' },
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          provider: 'Google',
          accessToken: 'at',
          refreshToken: 'rt',
          expiresAt: '2026-01-01T00:00:00.000Z',
          displayName: 'Google User',
          email: 'google.user@pillmind.app',
        }),
      })),
    );

    const result = await loginWithSocial('Google');

    expect(result.provider).toBe('Google');
    expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:5047/api/auth/social-login',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('apple flow sonrasi apiye token gonderir', async () => {
    isAppleAvailableMock.mockResolvedValue(true);
    appleSignInMock.mockResolvedValue({
      identityToken: 'apple-identity-token',
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          provider: 'Apple',
          accessToken: 'at',
          refreshToken: 'rt',
          expiresAt: '2026-01-01T00:00:00.000Z',
          displayName: 'Apple User',
          email: 'apple.user@pillmind.app',
        }),
      })),
    );

    const result = await loginWithSocial('Apple');

    expect(result.provider).toBe('Apple');
    expect(fetch).toHaveBeenCalled();
  });

  it('google client id yoksa hata verir', async () => {
    vi.unstubAllEnvs();
    promptAsyncMock.mockResolvedValue({
      type: 'success',
      params: { id_token: 'token' },
    });

    await expect(loginWithSocial('Google')).rejects.toThrow('Google OAuth client id bulunamadi');
  });
});

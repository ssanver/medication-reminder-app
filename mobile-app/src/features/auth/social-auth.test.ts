import { afterEach, describe, expect, it, vi } from 'vitest';
import { loginWithSocial } from './social-auth';

describe('loginWithSocial', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('api basariliysa response degerini doner', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          provider: 'Google',
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresAt: '2026-01-01T00:00:00.000Z',
          displayName: 'Google User',
          email: 'google.user@pillmind.app',
        }),
      })),
    );

    const result = await loginWithSocial('Google');
    expect(result.provider).toBe('Google');
    expect(result.accessToken).toBe('token');
  });

  it('api hata donerse fallback mock basari doner', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
      })),
    );

    const result = await loginWithSocial('Google');
    expect(result.provider).toBe('Google');
    expect(result.email).toBe('google.user@pillmind.app');
  });

  it('network exception olursa fallback mock basari doner', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network');
      }),
    );

    const result = await loginWithSocial('Apple');
    expect(result.provider).toBe('Apple');
    expect(result.email).toBe('apple.user@pillmind.app');
  });
});

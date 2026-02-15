export type SocialProvider = 'Apple' | 'Google';

export type SocialLoginResult = {
  provider: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  displayName: string;
  email: string;
};

function getApiBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:5047';
}

function createMockSocialLogin(provider: SocialProvider): SocialLoginResult {
  const lower = provider.toLowerCase();
  const now = new Date();

  return {
    provider,
    accessToken: `${lower}-local-at-${now.getTime()}`,
    refreshToken: `${lower}-local-rt-${now.getTime()}`,
    expiresAt: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
    displayName: provider === 'Apple' ? 'Apple User' : 'Google User',
    email: provider === 'Apple' ? 'apple.user@pillmind.app' : 'google.user@pillmind.app',
  };
}

export async function loginWithSocial(provider: SocialProvider): Promise<SocialLoginResult> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/social-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: provider.toLowerCase(),
        providerToken: 'mock-provider-token',
      }),
    });

    if (!response.ok) {
      return createMockSocialLogin(provider);
    }

    return (await response.json()) as SocialLoginResult;
  } catch {
    return createMockSocialLogin(provider);
  }
}

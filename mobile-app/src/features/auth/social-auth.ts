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

export async function loginWithSocial(provider: SocialProvider): Promise<SocialLoginResult> {
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
    const message = await response.text();
    throw new Error(message || 'Social login failed.');
  }

  return (await response.json()) as SocialLoginResult;
}

import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

export type SocialProvider = 'Apple' | 'Google';

export type SocialLoginResult = {
  provider: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  displayName: string;
  email: string;
};

if (typeof window !== 'undefined') {
  WebBrowser.maybeCompleteAuthSession();
}

function getApiBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:5047';
}

function getGoogleClientId(): string {
  const configuredClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

  if (!configuredClientId) {
    throw new Error(
      'Google OAuth client id bulunamadi. mobile-app/.env dosyasina EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID veya EXPO_PUBLIC_GOOGLE_CLIENT_ID ekleyin.',
    );
  }

  return configuredClientId;
}

async function exchangeSocialToken(provider: SocialProvider, providerToken: string): Promise<SocialLoginResult> {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/social-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      provider: provider.toLowerCase(),
      providerToken,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Social login failed.');
  }

  return (await response.json()) as SocialLoginResult;
}

async function getGoogleIdToken(): Promise<string> {
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'medication-reminder',
    path: 'oauth2redirect',
  });

  const request = new AuthSession.AuthRequest({
    clientId: getGoogleClientId(),
    redirectUri,
    scopes: ['openid', 'profile', 'email'],
    responseType: 'id_token',
    usePKCE: false,
    extraParams: {
      nonce: `${Date.now()}`,
      prompt: 'select_account',
    },
  });

  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
  };

  const result = await request.promptAsync(discovery);

  if (result.type !== 'success') {
    throw new Error('Google sign-in iptal edildi.');
  }

  const idToken = result.params.id_token;

  if (!idToken) {
    throw new Error('Google id token alinamadi.');
  }

  return idToken;
}

async function getAppleIdentityToken(): Promise<string> {
  const isAppleAuthAvailable = await AppleAuthentication.isAvailableAsync();
  if (!isAppleAuthAvailable) {
    throw new Error('Apple Sign In bu cihazda kullanilamiyor.');
  }

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
  });

  if (!credential.identityToken) {
    throw new Error('Apple identity token alinamadi.');
  }

  return credential.identityToken;
}

export async function loginWithSocial(provider: SocialProvider): Promise<SocialLoginResult> {
  const providerToken = provider === 'Google' ? await getGoogleIdToken() : await getAppleIdentityToken();
  return exchangeSocialToken(provider, providerToken);
}

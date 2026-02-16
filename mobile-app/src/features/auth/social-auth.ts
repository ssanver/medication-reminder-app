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

function getPlatformOs(): string {
  try {
    return (require('react-native') as { Platform?: { OS?: string } }).Platform?.OS ?? 'ios';
  } catch {
    return 'ios';
  }
}

function getGoogleClientId(): string {
  const platformOs = getPlatformOs();
  const configuredClientId =
    (platformOs === 'ios' ? process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID : process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID) ??
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

  if (!configuredClientId) {
    throw new Error(
      platformOs === 'ios'
        ? 'Google OAuth client id bulunamadi. mobile-app/.env dosyasina EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID veya EXPO_PUBLIC_GOOGLE_CLIENT_ID ekleyin.'
        : 'Google OAuth client id bulunamadi. mobile-app/.env dosyasina EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID veya EXPO_PUBLIC_GOOGLE_CLIENT_ID ekleyin.',
    );
  }

  return configuredClientId;
}

function getGoogleRedirectUri(clientId: string): string {
  const nativeClient = clientId.replace('.apps.googleusercontent.com', '');
  const nativeScheme = `com.googleusercontent.apps.${nativeClient}`;

  return AuthSession.makeRedirectUri({
    native: `${nativeScheme}:/oauth2redirect`,
  });
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
  const clientId = getGoogleClientId();
  const redirectUri = getGoogleRedirectUri(clientId);

  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    scopes: ['openid', 'profile', 'email'],
    responseType: 'code',
    usePKCE: true,
    extraParams: {
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

  // Prefer direct id_token when provided by provider.
  const directIdToken = result.params.id_token;
  if (directIdToken) {
    return directIdToken;
  }

  const code = result.params.code;
  if (!code) {
    throw new Error('Google authorization code alinamadi.');
  }

  const tokenResponse = await AuthSession.exchangeCodeAsync(
    {
      clientId,
      code,
      redirectUri,
      extraParams: {
        code_verifier: request.codeVerifier ?? '',
      },
    },
    discovery,
  );

  if (!tokenResponse.idToken) {
    throw new Error('Google id token alinamadi.');
  }

  return tokenResponse.idToken;
}

async function getAppleIdentityToken(): Promise<string> {
  const isAppleAuthAvailable = await AppleAuthentication.isAvailableAsync();
  if (!isAppleAuthAvailable) {
    throw new Error('Apple Sign In bu cihazda kullanilamiyor.');
  }

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
    });
  } catch (error) {
    if (error instanceof Error) {
      const code = (error as { code?: string }).code;
      if (code === 'ERR_REQUEST_CANCELED') {
        throw new Error('Apple giris islemi iptal edildi.');
      }

      if (code === 'ERR_INVALID_OPERATION') {
        throw new Error(
          'Apple girisi baslatilamadi. iOS simulator veya cihazda Apple ID ile giris yaptiginizdan ve development build kullandiginizdan emin olun.',
        );
      }
    }

    throw new Error(
      'Apple girisi basarisiz. iOS simulator/cihaz Apple ID girisi, Sign In with Apple yetkisi ve development build ayarlarini kontrol edin.',
    );
  }

  if (!credential.identityToken) {
    throw new Error('Apple identity token alinamadi.');
  }

  return credential.identityToken;
}

export async function loginWithSocial(provider: SocialProvider): Promise<SocialLoginResult> {
  const providerToken = provider === 'Google' ? await getGoogleIdToken() : await getAppleIdentityToken();
  return exchangeSocialToken(provider, providerToken);
}

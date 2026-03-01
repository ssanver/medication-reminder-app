import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_IS_LOGGED_IN = 'auth:isLoggedIn';
const KEY_HAS_COMPLETED_ONBOARDING = 'auth:hasCompletedOnboarding';
const KEY_HAS_SEEN_PERMISSION_SCREEN = 'auth:hasSeenPermissionScreen';
const KEY_ACCESS_TOKEN = 'auth:accessToken';
const KEY_REFRESH_TOKEN = 'auth:refreshToken';
const KEY_CACHED_USER = 'auth:cachedUser';
const KEY_EMAIL = 'auth:email';
const KEY_EMAIL_VERIFIED = 'auth:emailVerified';
const KEY_HAS_SEEN_SPLASH_ONCE = 'auth:hasSeenSplashOnce';
const KEY_IS_GUEST_MODE = 'auth:isGuestMode';

export type AuthSession = {
  isLoggedIn: boolean;
  isGuestMode: boolean;
  hasCompletedOnboarding: boolean;
  hasSeenPermissionScreen: boolean;
  hasSeenSplashOnce: boolean;
  email: string;
  emailVerified: boolean;
};

const authSessionListeners = new Set<() => void>();

function emitAuthSessionChanged(): void {
  authSessionListeners.forEach((listener) => listener());
}

export function subscribeAuthSession(listener: () => void): () => void {
  authSessionListeners.add(listener);
  return () => authSessionListeners.delete(listener);
}

function parseFlag(value: string | null): boolean {
  return value === 'true';
}

export async function loadAuthSession(): Promise<AuthSession> {
  const [isLoggedInRaw, isGuestModeRaw, hasCompletedOnboardingRaw, hasSeenPermissionScreenRaw, hasSeenSplashOnceRaw, emailRaw, emailVerifiedRaw] = await Promise.all([
    AsyncStorage.getItem(KEY_IS_LOGGED_IN),
    AsyncStorage.getItem(KEY_IS_GUEST_MODE),
    AsyncStorage.getItem(KEY_HAS_COMPLETED_ONBOARDING),
    AsyncStorage.getItem(KEY_HAS_SEEN_PERMISSION_SCREEN),
    AsyncStorage.getItem(KEY_HAS_SEEN_SPLASH_ONCE),
    AsyncStorage.getItem(KEY_EMAIL),
    AsyncStorage.getItem(KEY_EMAIL_VERIFIED),
  ]);

  return {
    isLoggedIn: parseFlag(isLoggedInRaw),
    isGuestMode: parseFlag(isGuestModeRaw),
    hasCompletedOnboarding: parseFlag(hasCompletedOnboardingRaw),
    hasSeenPermissionScreen: parseFlag(hasSeenPermissionScreenRaw),
    hasSeenSplashOnce: parseFlag(hasSeenSplashOnceRaw),
    email: emailRaw ?? '',
    emailVerified: parseFlag(emailVerifiedRaw),
  };
}

export async function setOnboardingCompleted(value: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY_HAS_COMPLETED_ONBOARDING, value ? 'true' : 'false');
  emitAuthSessionChanged();
}

export async function setPermissionScreenSeen(value: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY_HAS_SEEN_PERMISSION_SCREEN, value ? 'true' : 'false');
  emitAuthSessionChanged();
}

export async function setLoggedIn(value: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY_IS_LOGGED_IN, value ? 'true' : 'false');
  emitAuthSessionChanged();
}

export async function markAuthenticated(payload: {
  accessToken?: string;
  refreshToken?: string;
  email?: string;
  emailVerified?: boolean;
} = {}): Promise<void> {
  const hasValidSession = Boolean(payload.accessToken && payload.email);
  const writes: Array<Promise<void>> = [
    AsyncStorage.setItem(KEY_IS_LOGGED_IN, hasValidSession ? 'true' : 'false'),
    AsyncStorage.setItem(KEY_IS_GUEST_MODE, 'false'),
    AsyncStorage.setItem(KEY_HAS_COMPLETED_ONBOARDING, 'true'),
  ];

  if (payload.accessToken) {
    writes.push(AsyncStorage.setItem(KEY_ACCESS_TOKEN, payload.accessToken));
  } else {
    writes.push(AsyncStorage.removeItem(KEY_ACCESS_TOKEN));
  }

  if (payload.refreshToken) {
    writes.push(AsyncStorage.setItem(KEY_REFRESH_TOKEN, payload.refreshToken));
  } else {
    writes.push(AsyncStorage.removeItem(KEY_REFRESH_TOKEN));
  }

  if (payload.email) {
    writes.push(AsyncStorage.setItem(KEY_EMAIL, payload.email.trim().toLowerCase()));
  } else {
    writes.push(AsyncStorage.removeItem(KEY_EMAIL));
  }

  writes.push(AsyncStorage.setItem(KEY_EMAIL_VERIFIED, payload.emailVerified ? 'true' : 'false'));

  await Promise.all(writes);
  emitAuthSessionChanged();
}

export async function markGuestMode(payload: {
  accessToken?: string;
  refreshToken?: string;
  email?: string;
} = {}): Promise<void> {
  const writes: Array<Promise<void>> = [
    AsyncStorage.setItem(KEY_IS_LOGGED_IN, 'false'),
    AsyncStorage.setItem(KEY_IS_GUEST_MODE, 'true'),
    AsyncStorage.setItem(KEY_HAS_COMPLETED_ONBOARDING, 'true'),
    AsyncStorage.removeItem(KEY_CACHED_USER),
    AsyncStorage.setItem(KEY_EMAIL_VERIFIED, 'true'),
  ];

  if (payload.accessToken) {
    writes.push(AsyncStorage.setItem(KEY_ACCESS_TOKEN, payload.accessToken));
  } else {
    writes.push(AsyncStorage.removeItem(KEY_ACCESS_TOKEN));
  }

  if (payload.refreshToken) {
    writes.push(AsyncStorage.setItem(KEY_REFRESH_TOKEN, payload.refreshToken));
  } else {
    writes.push(AsyncStorage.removeItem(KEY_REFRESH_TOKEN));
  }

  if (payload.email) {
    writes.push(AsyncStorage.setItem(KEY_EMAIL, payload.email.trim().toLowerCase()));
  } else {
    writes.push(AsyncStorage.removeItem(KEY_EMAIL));
  }

  await Promise.all(writes);
  emitAuthSessionChanged();
}

export async function setEmailVerified(value: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY_EMAIL_VERIFIED, value ? 'true' : 'false');
  emitAuthSessionChanged();
}

export async function setSplashSeen(value: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY_HAS_SEEN_SPLASH_ONCE, value ? 'true' : 'false');
  emitAuthSessionChanged();
}

export async function clearSessionForLogout(): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(KEY_IS_LOGGED_IN, 'false'),
    AsyncStorage.setItem(KEY_IS_GUEST_MODE, 'false'),
    AsyncStorage.removeItem(KEY_ACCESS_TOKEN),
    AsyncStorage.removeItem(KEY_REFRESH_TOKEN),
    AsyncStorage.removeItem(KEY_CACHED_USER),
    AsyncStorage.removeItem(KEY_EMAIL),
    AsyncStorage.removeItem(KEY_EMAIL_VERIFIED),
  ]);
  emitAuthSessionChanged();
}

export async function loadAccessToken(): Promise<string | null> {
  let token: string | null = null;
  try {
    token = await AsyncStorage.getItem(KEY_ACCESS_TOKEN);
  } catch {
    return null;
  }

  if (!token || token.trim().length === 0) {
    return null;
  }

  return token.trim();
}

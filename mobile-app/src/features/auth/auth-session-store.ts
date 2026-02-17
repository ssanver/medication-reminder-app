import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_IS_LOGGED_IN = 'auth:isLoggedIn';
const KEY_HAS_COMPLETED_ONBOARDING = 'auth:hasCompletedOnboarding';
const KEY_HAS_SEEN_PERMISSION_SCREEN = 'auth:hasSeenPermissionScreen';
const KEY_ACCESS_TOKEN = 'auth:accessToken';
const KEY_REFRESH_TOKEN = 'auth:refreshToken';
const KEY_CACHED_USER = 'auth:cachedUser';
const KEY_EMAIL = 'auth:email';
const KEY_EMAIL_VERIFIED = 'auth:emailVerified';

export type AuthSession = {
  isLoggedIn: boolean;
  hasCompletedOnboarding: boolean;
  hasSeenPermissionScreen: boolean;
  email: string;
  emailVerified: boolean;
};

function parseFlag(value: string | null): boolean {
  return value === 'true';
}

export async function loadAuthSession(): Promise<AuthSession> {
  const [isLoggedInRaw, hasCompletedOnboardingRaw, hasSeenPermissionScreenRaw, emailRaw, emailVerifiedRaw] = await Promise.all([
    AsyncStorage.getItem(KEY_IS_LOGGED_IN),
    AsyncStorage.getItem(KEY_HAS_COMPLETED_ONBOARDING),
    AsyncStorage.getItem(KEY_HAS_SEEN_PERMISSION_SCREEN),
    AsyncStorage.getItem(KEY_EMAIL),
    AsyncStorage.getItem(KEY_EMAIL_VERIFIED),
  ]);

  return {
    isLoggedIn: parseFlag(isLoggedInRaw),
    hasCompletedOnboarding: parseFlag(hasCompletedOnboardingRaw),
    hasSeenPermissionScreen: parseFlag(hasSeenPermissionScreenRaw),
    email: emailRaw ?? '',
    emailVerified: parseFlag(emailVerifiedRaw),
  };
}

export async function setOnboardingCompleted(value: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY_HAS_COMPLETED_ONBOARDING, value ? 'true' : 'false');
}

export async function setPermissionScreenSeen(value: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY_HAS_SEEN_PERMISSION_SCREEN, value ? 'true' : 'false');
}

export async function setLoggedIn(value: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY_IS_LOGGED_IN, value ? 'true' : 'false');
}

export async function markAuthenticated(payload: {
  accessToken?: string;
  refreshToken?: string;
  email?: string;
  emailVerified?: boolean;
} = {}): Promise<void> {
  const writes: Array<Promise<void>> = [setLoggedIn(true), setOnboardingCompleted(true)];

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
}

export async function setEmailVerified(value: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY_EMAIL_VERIFIED, value ? 'true' : 'false');
}

export async function clearSessionForLogout(): Promise<void> {
  await Promise.all([
    setLoggedIn(false),
    AsyncStorage.removeItem(KEY_ACCESS_TOKEN),
    AsyncStorage.removeItem(KEY_REFRESH_TOKEN),
    AsyncStorage.removeItem(KEY_CACHED_USER),
    AsyncStorage.removeItem(KEY_EMAIL),
    AsyncStorage.removeItem(KEY_EMAIL_VERIFIED),
  ]);
}

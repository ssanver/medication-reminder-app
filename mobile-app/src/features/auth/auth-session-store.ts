import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_IS_LOGGED_IN = 'auth:isLoggedIn';
const KEY_HAS_COMPLETED_ONBOARDING = 'auth:hasCompletedOnboarding';
const KEY_HAS_SEEN_PERMISSION_SCREEN = 'auth:hasSeenPermissionScreen';

export type AuthSession = {
  isLoggedIn: boolean;
  hasCompletedOnboarding: boolean;
  hasSeenPermissionScreen: boolean;
};

function parseFlag(value: string | null): boolean {
  return value === 'true';
}

export async function loadAuthSession(): Promise<AuthSession> {
  const [isLoggedInRaw, hasCompletedOnboardingRaw, hasSeenPermissionScreenRaw] = await Promise.all([
    AsyncStorage.getItem(KEY_IS_LOGGED_IN),
    AsyncStorage.getItem(KEY_HAS_COMPLETED_ONBOARDING),
    AsyncStorage.getItem(KEY_HAS_SEEN_PERMISSION_SCREEN),
  ]);

  return {
    isLoggedIn: parseFlag(isLoggedInRaw),
    hasCompletedOnboarding: parseFlag(hasCompletedOnboardingRaw),
    hasSeenPermissionScreen: parseFlag(hasSeenPermissionScreenRaw),
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

export async function markAuthenticated(): Promise<void> {
  await Promise.all([setLoggedIn(true), setOnboardingCompleted(true)]);
}

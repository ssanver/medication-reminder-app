import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_AD_FREE_STATUS = 'monetization:adFreeStatus';

export type SubscriptionOffer = {
  id: string;
  localized: Record<string, { title: string; priceLabel: string }>;
};

export type AdFreeStatus = {
  isAdFree: boolean;
  planId: string | null;
  activatedAt: string | null;
};

const listeners = new Set<(status: AdFreeStatus) => void>();

const defaultStatus: AdFreeStatus = {
  isAdFree: false,
  planId: null,
  activatedAt: null,
};

function emit(status: AdFreeStatus): void {
  listeners.forEach((listener) => listener(status));
}

export function subscribeAdFreeStatus(listener: (status: AdFreeStatus) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function getAdFreeStatus(): Promise<AdFreeStatus> {
  try {
    const raw = await AsyncStorage.getItem(KEY_AD_FREE_STATUS);
    if (!raw) {
      return defaultStatus;
    }

    const parsed = JSON.parse(raw) as Partial<AdFreeStatus>;
    return {
      isAdFree: parsed.isAdFree === true,
      planId: typeof parsed.planId === 'string' ? parsed.planId : null,
      activatedAt: typeof parsed.activatedAt === 'string' ? parsed.activatedAt : null,
    };
  } catch {
    return defaultStatus;
  }
}

export async function activateAdFreeMode(planId: string): Promise<void> {
  const status: AdFreeStatus = {
    isAdFree: true,
    planId,
    activatedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(KEY_AD_FREE_STATUS, JSON.stringify(status));
  emit(status);
}

export async function clearAdFreeMode(): Promise<void> {
  await AsyncStorage.removeItem(KEY_AD_FREE_STATUS);
  emit(defaultStatus);
}

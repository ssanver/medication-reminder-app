import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequestJson } from '../network/api-client';
import type { UserRole } from '../auth/auth-session-store';
import type { AdFreeStatus, MonetizationStatus, SubscriptionOffer } from './domain/monetization-types';

const KEY_MONETIZATION_STATUS = 'monetization:status';

type SubscriptionStatusApiResponse = {
  role: string;
  adsEnabled: boolean;
  activePlanId?: string | null;
  updatedAt?: string;
};

type SyncStoreSubscriptionApiRequest = {
  platform: 'ios' | 'android';
  isActive: boolean;
  planId?: string | null;
  storeToken?: string | null;
  transactionId?: string | null;
};

const listeners = new Set<(status: MonetizationStatus) => void>();

const defaultStatus: MonetizationStatus = {
  role: 'visitor',
  adsEnabled: true,
  activePlanId: null,
  updatedAt: null,
};

function toRole(value: string | undefined): UserRole {
  if (value === 'vip' || value === 'member' || value === 'visitor') {
    return value;
  }

  return 'visitor';
}

function toStatus(value: { role?: string; adsEnabled?: boolean; activePlanId?: string | null; updatedAt?: string | null }): MonetizationStatus {
  return {
    role: toRole(value.role),
    adsEnabled: value.adsEnabled !== false,
    activePlanId: typeof value.activePlanId === 'string' && value.activePlanId.trim().length > 0 ? value.activePlanId.trim() : null,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : null,
  };
}

function emit(status: MonetizationStatus): void {
  listeners.forEach((listener) => listener(status));
}

async function persistStatus(status: MonetizationStatus): Promise<void> {
  await AsyncStorage.setItem(KEY_MONETIZATION_STATUS, JSON.stringify(status));
}

async function readPersistedStatus(): Promise<MonetizationStatus> {
  try {
    const raw = await AsyncStorage.getItem(KEY_MONETIZATION_STATUS);
    if (!raw) {
      return defaultStatus;
    }

    const parsed = JSON.parse(raw) as Partial<MonetizationStatus>;
    return toStatus(parsed);
  } catch {
    return defaultStatus;
  }
}

function fromApi(response: SubscriptionStatusApiResponse): MonetizationStatus {
  return toStatus({
    role: response.role,
    adsEnabled: response.adsEnabled,
    activePlanId: response.activePlanId ?? null,
    updatedAt: response.updatedAt ?? new Date().toISOString(),
  });
}

async function persistApiStatus(response: SubscriptionStatusApiResponse): Promise<MonetizationStatus> {
  const persisted = await readPersistedStatus();
  const status = mergeMonetizationStatus(persisted, fromApi(response));
  await persistStatus(status);
  emit(status);
  return status;
}

export function mergeMonetizationStatus(
  persistedStatus: MonetizationStatus,
  apiStatus: MonetizationStatus,
): MonetizationStatus {
  const hasActiveStoreEntitlement =
    persistedStatus.role === 'vip'
    && typeof persistedStatus.activePlanId === 'string'
    && persistedStatus.activePlanId.trim().length > 0;

  if (hasActiveStoreEntitlement && apiStatus.role !== 'vip') {
    return persistedStatus;
  }

  return apiStatus;
}

async function fetchStatusFromApi(): Promise<MonetizationStatus> {
  const response = await apiRequestJson<SubscriptionStatusApiResponse>('/api/subscriptions/status', {
    correlationPrefix: 'subscription-status',
  });
  return persistApiStatus(response);
}

export function subscribeMonetizationStatus(listener: (status: MonetizationStatus) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function getMonetizationStatus(): Promise<MonetizationStatus> {
  return readPersistedStatus();
}

export async function refreshMonetizationStatus(): Promise<MonetizationStatus> {
  try {
    return await fetchStatusFromApi();
  } catch {
    return readPersistedStatus();
  }
}

export async function setMonetizationStatus(status: MonetizationStatus): Promise<MonetizationStatus> {
  const normalized = toStatus(status);
  await persistStatus(normalized);
  emit(normalized);
  return normalized;
}

export async function syncStoreSubscriptionStatus(request: SyncStoreSubscriptionApiRequest): Promise<MonetizationStatus> {
  const response = await apiRequestJson<SubscriptionStatusApiResponse>('/api/subscriptions/sync-store', {
    method: 'POST',
    correlationPrefix: 'subscription-sync-store',
    body: request,
  });

  return persistApiStatus(response);
}

export async function applyRoleToMonetizationStatus(role: UserRole): Promise<MonetizationStatus> {
  const next: MonetizationStatus = {
    role,
    adsEnabled: role !== 'vip',
    activePlanId: role === 'vip' ? 'premium' : null,
    updatedAt: new Date().toISOString(),
  };
  await persistStatus(next);
  emit(next);
  return next;
}

export function subscribeAdFreeStatus(listener: (status: AdFreeStatus) => void): () => void {
  return subscribeMonetizationStatus((status) => {
    listener({
      isAdFree: !status.adsEnabled,
      planId: status.activePlanId,
      activatedAt: status.updatedAt,
    });
  });
}

export async function getAdFreeStatus(): Promise<AdFreeStatus> {
  const status = await getMonetizationStatus();
  return {
    isAdFree: !status.adsEnabled,
    planId: status.activePlanId,
    activatedAt: status.updatedAt,
  };
}

export async function clearAdFreeMode(): Promise<void> {
  await applyRoleToMonetizationStatus('member');
}

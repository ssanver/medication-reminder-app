import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequestJson } from '../network/api-client';
import type { UserRole } from '../auth/auth-session-store';

const KEY_MONETIZATION_STATUS = 'monetization:status';

export type SubscriptionOffer = {
  id: string;
  localized: Record<string, { title: string; priceLabel: string; description?: string; badge?: string; ctaLabel?: string }>;
};

export type MonetizationStatus = {
  role: UserRole;
  adsEnabled: boolean;
  activePlanId: string | null;
  updatedAt: string | null;
};

export type AdFreeStatus = {
  isAdFree: boolean;
  planId: string | null;
  activatedAt: string | null;
};

type SubscriptionStatusApiResponse = {
  role: string;
  adsEnabled: boolean;
  activePlanId?: string | null;
  updatedAt?: string;
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

async function fetchStatusFromApi(): Promise<MonetizationStatus> {
  const response = await apiRequestJson<SubscriptionStatusApiResponse>('/api/subscriptions/status', {
    correlationPrefix: 'subscription-status',
  });
  const status = fromApi(response);
  await persistStatus(status);
  emit(status);
  return status;
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

export async function activateSubscriptionPlan(planId: string): Promise<MonetizationStatus> {
  const normalizedPlanId = planId.trim().toLowerCase();
  const response = await apiRequestJson<SubscriptionStatusApiResponse>('/api/subscriptions/activate', {
    method: 'POST',
    correlationPrefix: 'subscription-activate',
    body: {
      planId: normalizedPlanId,
      platform: 'mobile',
      storeToken: null,
    },
  });
  const status = fromApi(response);
  await persistStatus(status);
  emit(status);
  return status;
}

export async function setMonetizationStatus(status: MonetizationStatus): Promise<MonetizationStatus> {
  const normalized = toStatus(status);
  await persistStatus(normalized);
  emit(normalized);
  return normalized;
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

export async function activateAdFreeMode(planId: string): Promise<void> {
  await activateSubscriptionPlan(planId);
}

export async function clearAdFreeMode(): Promise<void> {
  await applyRoleToMonetizationStatus('member');
}

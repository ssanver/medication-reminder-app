import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { loadAuthSession } from '../auth/auth-session-store';
import { apiRequestJson } from '../network/api-client';
import { currentUser } from '../profile/current-user';

export type NotificationActionType = 'shown' | 'open' | 'take-now' | 'skip' | 'snooze';

export type NotificationHistoryItem = {
  id: string;
  medicationId: string;
  dateKey: string;
  scheduledTime: string;
  medicationName: string;
  medicationDetails: string;
  lastAction: NotificationActionType;
  snoozeMinutes?: number;
  lastActionAt: string;
  updatedAt: string;
};

const STORAGE_KEY = 'notification-history-v1';
const DELIVERY_MAP_STORAGE_KEY = 'notification-delivery-map-v1';
const MAX_ITEMS = 200;
const listeners = new Set<() => void>();

let state: NotificationHistoryItem[] = [];
let hydrated = false;

type NotificationActionApiResponse = {
  id: string;
  deliveryId: string;
  userReference: string;
  actionType: string;
  actionAt: string;
  clientPlatform: string;
  appVersion: string;
  metadataJson?: string | null;
  createdAt: string;
};

type NotificationDeliveryApiResponse = {
  id: string;
};

type NotificationHistoryMetadata = {
  medicationId?: string;
  dateKey?: string;
  scheduledTime?: string;
  medicationName?: string;
  medicationDetails?: string;
  snoozeMinutes?: number;
};

function emit(): void {
  listeners.forEach((listener) => listener());
}

function toKey(payload: {
  medicationId: string;
  dateKey: string;
  scheduledTime: string;
}): string {
  return `${payload.medicationId}-${payload.dateKey}-${payload.scheduledTime}`;
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toTimeLabel(date: Date): string {
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${hours}:${minutes}`;
}

function normalizeRemoteAction(actionType: string): NotificationActionType {
  if (actionType === 'take-now') {
    return 'take-now';
  }

  if (actionType === 'skip') {
    return 'skip';
  }

  if (actionType === 'open') {
    return 'open';
  }

  if (actionType.startsWith('snooze')) {
    return 'snooze';
  }

  return 'shown';
}

function parseMetadata(raw?: string | null): NotificationHistoryMetadata {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as NotificationHistoryMetadata;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function mapRemoteActionToHistoryItem(action: NotificationActionApiResponse): NotificationHistoryItem {
  const metadata = parseMetadata(action.metadataJson);
  const actionDate = new Date(action.actionAt);
  const normalizedDate = Number.isNaN(actionDate.getTime()) ? new Date() : actionDate;
  const dateKey = metadata.dateKey ?? toDateKey(normalizedDate);
  const scheduledTime = metadata.scheduledTime ?? toTimeLabel(normalizedDate);
  const medicationId = metadata.medicationId ?? action.deliveryId;
  const id = `${medicationId}-${dateKey}-${scheduledTime}`;
  const normalizedAction = normalizeRemoteAction(action.actionType);

  return {
    id,
    medicationId,
    dateKey,
    scheduledTime,
    medicationName: metadata.medicationName ?? 'Medication',
    medicationDetails: metadata.medicationDetails ?? 'Dose reminder',
    lastAction: normalizedAction,
    snoozeMinutes: normalizedAction === 'snooze' ? metadata.snoozeMinutes ?? 5 : undefined,
    lastActionAt: action.actionAt,
    updatedAt: action.createdAt ?? action.actionAt,
  };
}

function toActionTypeForApi(action: NotificationActionType): string | null {
  if (action === 'take-now') {
    return 'take-now';
  }

  if (action === 'skip') {
    return 'skip';
  }

  if (action === 'open') {
    return 'open';
  }

  if (action === 'snooze') {
    return 'snooze-5min';
  }

  return null;
}

function toScheduledAt(dateKey: string, scheduledTime: string): string {
  const [hours = '0', minutes = '0'] = scheduledTime.split(':');
  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toISOString();
}

async function resolveUserReference(): Promise<string> {
  const session = await loadAuthSession();
  const sessionEmail = session.email.trim().toLowerCase();
  if (sessionEmail.length > 0) {
    return sessionEmail;
  }

  return currentUser.email.trim().toLowerCase();
}

async function readDeliveryMap(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(DELIVERY_MAP_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as Record<string, string>;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

async function writeDeliveryMap(map: Record<string, string>): Promise<void> {
  await AsyncStorage.setItem(DELIVERY_MAP_STORAGE_KEY, JSON.stringify(map));
}

async function ensureDeliveryId(payload: {
  userReference: string;
  medicationId: string;
  dateKey: string;
  scheduledTime: string;
}): Promise<string> {
  const historyKey = toKey(payload);
  const map = await readDeliveryMap();
  const existingDeliveryId = map[historyKey];
  if (existingDeliveryId) {
    return existingDeliveryId;
  }

  const channel = Platform.OS === 'android' ? 'android-local' : 'ios-local';
  const delivery = await apiRequestJson<NotificationDeliveryApiResponse>('/api/notification-deliveries', {
    method: 'POST',
    correlationPrefix: 'notif-delivery',
    body: {
      userReference: payload.userReference,
      medicationId: null,
      scheduledAt: toScheduledAt(payload.dateKey, payload.scheduledTime),
      sentAt: new Date().toISOString(),
      channel,
      status: 'sent',
      providerMessageId: null,
      errorCode: null,
      errorMessage: null,
    },
  });

  const nextMap = {
    ...map,
    [historyKey]: delivery.id,
  };
  await writeDeliveryMap(nextMap);
  return delivery.id;
}

async function syncHistoryToBackend(payload: {
  medicationId: string;
  dateKey: string;
  scheduledTime: string;
  medicationName: string;
  medicationDetails: string;
  action: NotificationActionType;
  snoozeMinutes?: number;
}): Promise<void> {
  const actionType = toActionTypeForApi(payload.action);
  if (!actionType) {
    return;
  }

  const userReference = await resolveUserReference();
  if (!userReference) {
    return;
  }

  const deliveryId = await ensureDeliveryId({
    userReference,
    medicationId: payload.medicationId,
    dateKey: payload.dateKey,
    scheduledTime: payload.scheduledTime,
  });

  const metadata = {
    medicationId: payload.medicationId,
    dateKey: payload.dateKey,
    scheduledTime: payload.scheduledTime,
    medicationName: payload.medicationName,
    medicationDetails: payload.medicationDetails,
    snoozeMinutes: payload.snoozeMinutes,
  };

  await apiRequestJson('/api/notification-actions', {
    method: 'POST',
    correlationPrefix: 'notif-action',
    body: {
      deliveryId,
      userReference,
      actionType,
      actionAt: new Date().toISOString(),
      clientPlatform: Platform.OS,
      appVersion: process.env.EXPO_PUBLIC_APP_VERSION ?? '0.1.0',
      metadataJson: JSON.stringify(metadata),
    },
  });
}

async function fetchNotificationHistoryFromBackend(): Promise<NotificationHistoryItem[]> {
  const userReference = await resolveUserReference();
  if (!userReference) {
    return [];
  }

  const encodedUser = encodeURIComponent(userReference);
  const response = await apiRequestJson<NotificationActionApiResponse[]>(
    `/api/notification-actions?userReference=${encodedUser}&take=${MAX_ITEMS}`,
    {
      method: 'GET',
      correlationPrefix: 'notif-history',
    },
  );

  const dedup = new Map<string, NotificationHistoryItem>();
  for (const action of response) {
    const mapped = mapRemoteActionToHistoryItem(action);
    const existing = dedup.get(mapped.id);
    if (!existing || existing.updatedAt < mapped.updatedAt) {
      dedup.set(mapped.id, mapped);
    }
  }

  return [...dedup.values()]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, MAX_ITEMS);
}

async function persist(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.slice(0, MAX_ITEMS)));
}

export async function hydrateNotificationHistory(): Promise<void> {
  if (hydrated) {
    return;
  }

  hydrated = true;
  let localState: NotificationHistoryItem[] = [];

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localState = [];
    } else {
      const parsed = JSON.parse(raw) as NotificationHistoryItem[];
      if (Array.isArray(parsed)) {
        localState = parsed.slice(0, MAX_ITEMS);
      }
    }
  } catch {
    localState = [];
  }

  try {
    const remoteItems = await fetchNotificationHistoryFromBackend();
    state = remoteItems;
    emit();
    await persist();
    return;
  } catch {
    // Fallback to local cache when backend is unavailable.
  }

  state = localState;
  emit();
}

export function subscribeNotificationHistory(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getNotificationHistorySnapshot(): NotificationHistoryItem[] {
  return state;
}

export async function recordNotificationHistory(payload: {
  medicationId: string;
  dateKey: string;
  scheduledTime: string;
  medicationName: string;
  medicationDetails: string;
  action: NotificationActionType;
  snoozeMinutes?: number;
}): Promise<void> {
  const id = toKey(payload);
  const now = new Date().toISOString();
  const existing = state.find((item) => item.id === id);

  if (existing) {
    state = state.map((item) =>
      item.id === id
        ? {
            ...item,
            medicationName: payload.medicationName,
            medicationDetails: payload.medicationDetails,
            lastAction: payload.action,
            snoozeMinutes: payload.snoozeMinutes,
            lastActionAt: now,
            updatedAt: now,
          }
        : item,
    );
  } else {
    state = [
      {
        id,
        medicationId: payload.medicationId,
        dateKey: payload.dateKey,
        scheduledTime: payload.scheduledTime,
        medicationName: payload.medicationName,
        medicationDetails: payload.medicationDetails,
        lastAction: payload.action,
        snoozeMinutes: payload.snoozeMinutes,
        lastActionAt: now,
        updatedAt: now,
      },
      ...state,
    ].slice(0, MAX_ITEMS);
  }

  emit();
  await persist();

  try {
    await syncHistoryToBackend(payload);
  } catch {
    // Local-first persistence remains source of truth if backend sync fails.
  }
}

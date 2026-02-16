import AsyncStorage from '@react-native-async-storage/async-storage';

export type NotificationActionType = 'shown' | 'open' | 'take-now' | 'skip' | 'snooze-5min';

export type NotificationHistoryItem = {
  id: string;
  medicationId: string;
  dateKey: string;
  scheduledTime: string;
  medicationName: string;
  medicationDetails: string;
  lastAction: NotificationActionType;
  lastActionAt: string;
  updatedAt: string;
};

const STORAGE_KEY = 'notification-history-v1';
const MAX_ITEMS = 200;
const listeners = new Set<() => void>();

let state: NotificationHistoryItem[] = [];
let hydrated = false;

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

async function persist(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.slice(0, MAX_ITEMS)));
}

export async function hydrateNotificationHistory(): Promise<void> {
  if (hydrated) {
    return;
  }

  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw) as NotificationHistoryItem[];
    if (!Array.isArray(parsed)) {
      return;
    }

    state = parsed.slice(0, MAX_ITEMS);
    emit();
  } catch {
    // Keep in-memory fallback.
  }
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
        lastActionAt: now,
        updatedAt: now,
      },
      ...state,
    ].slice(0, MAX_ITEMS);
  }

  emit();
  await persist();
}

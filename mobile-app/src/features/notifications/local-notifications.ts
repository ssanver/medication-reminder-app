import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { type Locale } from '../localization/localization';
import { getScheduledDosesForDate, setDoseStatus } from '../medications/medication-store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldShowAlert: false,
    shouldShowBanner: false,
    shouldShowList: false,
    shouldSetBadge: false,
  }),
});

let configured = false;
let responseListenerConfigured = false;
let receivedListenerConfigured = false;
const MEDICATION_NOTIFICATION_IDS_KEY = 'scheduled-medication-notification-ids-v1';
const REMINDER_CATEGORY_ID = 'medication-dose-actions';
const TAKE_NOW_ACTION_ID = 'take-now';
const SKIP_ACTION_ID = 'skip-dose';
const SCHEDULE_WINDOW_DAYS = 30;
const MAX_SCHEDULED_REMINDERS = 60;
const LATE_REMINDER_GRACE_MS = 15 * 60 * 1000;

type MedicationReminderPayload = {
  medicationId: string;
  dateKey: string;
  scheduledTime: string;
  medicationName: string;
  medicationDetails: string;
};

export type ReminderPrompt = MedicationReminderPayload;
const reminderPromptListeners = new Set<() => void>();
let reminderPrompt: ReminderPrompt | null = null;

function setReminderPrompt(next: ReminderPrompt | null): void {
  reminderPrompt = next;
  reminderPromptListeners.forEach((listener) => listener());
}

export function dismissReminderPrompt(): void {
  setReminderPrompt(null);
}

export function getReminderPromptSnapshot(): ReminderPrompt | null {
  return reminderPrompt;
}

export function subscribeReminderPrompt(listener: () => void): () => void {
  reminderPromptListeners.add(listener);
  return () => {
    reminderPromptListeners.delete(listener);
  };
}

function buildReminderPayload(
  payload: Partial<MedicationReminderPayload> | undefined,
  titleFallback = '',
  bodyFallback = '',
): ReminderPrompt | null {
  if (!payload?.medicationId || !payload?.dateKey || !payload?.scheduledTime) {
    return null;
  }

  return {
    medicationId: payload.medicationId,
    dateKey: payload.dateKey,
    scheduledTime: payload.scheduledTime,
    medicationName: payload.medicationName || titleFallback || 'Medication',
    medicationDetails: payload.medicationDetails || bodyFallback || 'Dose reminder',
  };
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted || existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
      return true;
    }

    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  } catch {
    return false;
  }
}

export async function configureNotificationChannel(): Promise<void> {
  if (configured) {
    return;
  }

  try {
    await Notifications.setNotificationChannelAsync('medication-reminders', {
      name: 'Medication Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1256DB',
      sound: 'default',
    });
  } catch {
    // iOS or unsupported env.
  }

  try {
    const actionLabels = {
      takeNow: 'Take Now',
      skip: 'Skip',
    };
    await Notifications.setNotificationCategoryAsync(REMINDER_CATEGORY_ID, [
      {
        identifier: TAKE_NOW_ACTION_ID,
        buttonTitle: actionLabels.takeNow,
        options: {
          isDestructive: false,
          opensAppToForeground: true,
        },
      },
      {
        identifier: SKIP_ACTION_ID,
        buttonTitle: actionLabels.skip,
        options: {
          isDestructive: true,
          opensAppToForeground: true,
        },
      },
    ]);
  } catch {
    // Unsupported env.
  }

  configured = true;
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toScheduledDate(baseDate: Date, scheduledTime: string): Date {
  const [hours = '0', minutes = '0'] = scheduledTime.split(':');
  const scheduled = new Date(baseDate);
  scheduled.setHours(Number(hours), Number(minutes), 0, 0);
  return scheduled;
}

async function readTrackedNotificationIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(MEDICATION_NOTIFICATION_IDS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeTrackedNotificationIds(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(MEDICATION_NOTIFICATION_IDS_KEY, JSON.stringify(ids));
}

export async function clearMedicationReminderNotifications(): Promise<void> {
  const ids = await readTrackedNotificationIds();
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)));
  await writeTrackedNotificationIds([]);
}

export function ensureMedicationNotificationResponseListener(): void {
  if (responseListenerConfigured) {
    return;
  }

  Notifications.addNotificationResponseReceivedListener((response) => {
    const payload = buildReminderPayload(
      response.notification.request.content.data as Partial<MedicationReminderPayload> | undefined,
      response.notification.request.content.title ?? '',
      response.notification.request.content.body ?? '',
    );
    if (!payload) {
      return;
    }

    const date = new Date(`${payload.dateKey}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return;
    }

    if (response.actionIdentifier === TAKE_NOW_ACTION_ID) {
      dismissReminderPrompt();
      void setDoseStatus(payload.medicationId, date, 'taken', payload.scheduledTime);
      return;
    }

    if (response.actionIdentifier === SKIP_ACTION_ID) {
      dismissReminderPrompt();
      void setDoseStatus(payload.medicationId, date, 'missed', payload.scheduledTime);
      return;
    }

    if (response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      setReminderPrompt(payload);
    }
  });

  responseListenerConfigured = true;
}

export function ensureMedicationNotificationReceivedListener(): void {
  if (receivedListenerConfigured) {
    return;
  }

  Notifications.addNotificationReceivedListener((notification) => {
    const payload = buildReminderPayload(
      notification.request.content.data as Partial<MedicationReminderPayload> | undefined,
      notification.request.content.title ?? '',
      notification.request.content.body ?? '',
    );
    if (!payload) {
      return;
    }

    setReminderPrompt(payload);
  });

  receivedListenerConfigured = true;
}

export async function syncMedicationReminderNotifications(locale: Locale, enabled: boolean): Promise<void> {
  if (!enabled) {
    await clearMedicationReminderNotifications();
    return;
  }

  const granted = await ensureNotificationPermissions();
  if (!granted) {
    await clearMedicationReminderNotifications();
    return;
  }

  await configureNotificationChannel();
  ensureMedicationNotificationResponseListener();
  ensureMedicationNotificationReceivedListener();

  await clearMedicationReminderNotifications();

  const now = new Date();
  const pendingReminders: Array<{ medicationId: string; dateKey: string; scheduledTime: string; name: string; details: string; triggerDate: Date }> = [];

  for (let offset = 0; offset <= SCHEDULE_WINDOW_DAYS; offset += 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const dateKey = toDateKey(date);
    const doses = getScheduledDosesForDate(date, locale).filter((dose) => dose.status === 'pending');

    for (const dose of doses) {
      let triggerDate = toScheduledDate(date, dose.scheduledTime);
      if (triggerDate.getTime() <= now.getTime()) {
        const delay = now.getTime() - triggerDate.getTime();
        if (delay > LATE_REMINDER_GRACE_MS) {
          continue;
        }

        // If a dose is very recently due, fire a near-immediate notification
        // instead of silently dropping it during resync.
        triggerDate = new Date(now.getTime() + 5000);
      }

      if (triggerDate.getTime() <= now.getTime()) {
        continue;
      }

      pendingReminders.push({
        medicationId: dose.medicationId,
        dateKey,
        scheduledTime: dose.scheduledTime,
        name: dose.name,
        details: dose.details,
        triggerDate,
      });
    }
  }

  pendingReminders.sort((a, b) => a.triggerDate.getTime() - b.triggerDate.getTime());
  const upcomingReminders = pendingReminders.slice(0, MAX_SCHEDULED_REMINDERS);
  const scheduledIds: string[] = [];

  for (const reminder of upcomingReminders) {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: locale === 'tr' ? `${reminder.scheduledTime} İlaçları` : `${reminder.scheduledTime} Medicines`,
        body: `${reminder.name} • ${reminder.details}`,
        sound: 'default',
        categoryIdentifier: REMINDER_CATEGORY_ID,
        data: {
          medicationId: reminder.medicationId,
          dateKey: reminder.dateKey,
          scheduledTime: reminder.scheduledTime,
          medicationName: reminder.name,
          medicationDetails: reminder.details,
        } satisfies MedicationReminderPayload,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder.triggerDate,
        channelId: 'medication-reminders',
      },
    });

    scheduledIds.push(identifier);
  }

  await writeTrackedNotificationIds(scheduledIds);
}

export async function scheduleSnoozeReminder(payload: {
  minutes: number;
  medicationName: string;
  localeTitle: string;
  localeBodyTemplate: (name: string, minutes: number) => string;
}): Promise<void> {
  const granted = await ensureNotificationPermissions();
  if (!granted) {
    return;
  }

  await configureNotificationChannel();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: payload.localeTitle,
      body: payload.localeBodyTemplate(payload.medicationName, payload.minutes),
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(payload.minutes, 1) * 60,
      channelId: 'medication-reminders',
    },
  });
}

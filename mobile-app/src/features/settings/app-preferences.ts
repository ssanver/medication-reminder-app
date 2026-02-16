import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupportedLocale, type Locale } from '../localization/localization';

const STORAGE_KEY = 'app-preferences-v1';

export type AppPreferences = {
  locale: Locale;
  fontScale: number;
  notificationsEnabled: boolean;
  medicationRemindersEnabled: boolean;
  snoozeMinutes: number;
};

function resolveDefaultLocale(): Locale {
  const rawLocale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
  const baseCode = rawLocale.split('-')[0] ?? '';

  if (isSupportedLocale(baseCode)) {
    return baseCode;
  }

  return 'en';
}

const defaultPreferences: AppPreferences = {
  locale: resolveDefaultLocale(),
  fontScale: 1,
  notificationsEnabled: true,
  medicationRemindersEnabled: true,
  snoozeMinutes: 15,
};

export async function loadAppPreferences(): Promise<AppPreferences> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultPreferences;
    }

    const parsed = JSON.parse(raw) as Partial<AppPreferences>;
    const locale = typeof parsed.locale === 'string' && isSupportedLocale(parsed.locale) ? parsed.locale : defaultPreferences.locale;
    const fontScale = typeof parsed.fontScale === 'number' ? parsed.fontScale : defaultPreferences.fontScale;
    const notificationsEnabled =
      typeof parsed.notificationsEnabled === 'boolean' ? parsed.notificationsEnabled : defaultPreferences.notificationsEnabled;
    const medicationRemindersEnabled =
      typeof parsed.medicationRemindersEnabled === 'boolean'
        ? parsed.medicationRemindersEnabled
        : defaultPreferences.medicationRemindersEnabled;
    const snoozeMinutes = typeof parsed.snoozeMinutes === 'number' ? parsed.snoozeMinutes : defaultPreferences.snoozeMinutes;

    return {
      locale,
      fontScale,
      notificationsEnabled,
      medicationRemindersEnabled,
      snoozeMinutes,
    };
  } catch {
    return defaultPreferences;
  }
}

export async function saveAppPreferences(preferences: AppPreferences): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}

export async function updateLocalePreference(locale: Locale): Promise<void> {
  const current = await loadAppPreferences();
  await saveAppPreferences({ ...current, locale });
}

export async function updateReminderPreferences(patch: Partial<Pick<AppPreferences, 'notificationsEnabled' | 'medicationRemindersEnabled' | 'snoozeMinutes'>>): Promise<void> {
  const current = await loadAppPreferences();
  await saveAppPreferences({
    ...current,
    ...patch,
  });
}

import { apiRequestJson } from '../network/api-client';
import { isSupportedLocale, type Locale } from '../localization/localization';
import { buildUserReferenceQuery } from '../auth/user-reference';
import { NativeModules, Platform } from 'react-native';

export type AppPreferences = {
  locale: Locale;
  fontScale: number;
  notificationsEnabled: boolean;
  medicationRemindersEnabled: boolean;
  snoozeMinutes: number;
};

type UserPreferencesApiResponse = {
  locale: string;
  fontScale: number;
  notificationsEnabled: boolean;
  medicationRemindersEnabled: boolean;
  snoozeMinutes: number;
  weekStartsOn: 'monday' | 'sunday';
  updatedAt: string;
};

export function resolveDefaultLocale(): Locale {
  const candidates: string[] = [];

  try {
    const intlLocale = Intl.DateTimeFormat().resolvedOptions().locale;
    if (typeof intlLocale === 'string' && intlLocale.trim().length > 0) {
      candidates.push(intlLocale);
    }
  } catch {
    // Ignore Intl locale resolution errors.
  }

  const navigatorLanguage = (globalThis as { navigator?: { language?: string } }).navigator?.language;
  if (typeof navigatorLanguage === 'string' && navigatorLanguage.trim().length > 0) {
    candidates.push(navigatorLanguage);
  }

  if (Platform.OS === 'ios') {
    const settings = (NativeModules as { SettingsManager?: { settings?: Record<string, unknown> } }).SettingsManager?.settings ?? {};
    const appleLocale = settings.AppleLocale;
    const appleLanguages = settings.AppleLanguages;

    if (typeof appleLocale === 'string' && appleLocale.trim().length > 0) {
      candidates.push(appleLocale);
    }
    if (Array.isArray(appleLanguages) && typeof appleLanguages[0] === 'string' && appleLanguages[0].trim().length > 0) {
      candidates.push(appleLanguages[0]);
    }
  } else {
    const localeIdentifier = (NativeModules as { I18nManager?: { localeIdentifier?: string } }).I18nManager?.localeIdentifier;
    if (typeof localeIdentifier === 'string' && localeIdentifier.trim().length > 0) {
      candidates.push(localeIdentifier);
    }
  }

  for (const candidate of candidates) {
    const normalized = candidate.trim().toLowerCase().replace('_', '-');
    const baseCode = normalized.split('-')[0] ?? '';
    if (isSupportedLocale(baseCode)) {
      return baseCode;
    }
  }

  return 'en';
}

const defaultPreferences: AppPreferences = {
  locale: resolveDefaultLocale(),
  fontScale: 1,
  notificationsEnabled: true,
  medicationRemindersEnabled: true,
  snoozeMinutes: 10,
};

function fromApi(response: UserPreferencesApiResponse): AppPreferences {
  const locale = isSupportedLocale(response.locale) ? response.locale : defaultPreferences.locale;
  const fontScale = typeof response.fontScale === 'number' ? response.fontScale : defaultPreferences.fontScale;
  const notificationsEnabled =
    typeof response.notificationsEnabled === 'boolean' ? response.notificationsEnabled : defaultPreferences.notificationsEnabled;
  const medicationRemindersEnabled =
    typeof response.medicationRemindersEnabled === 'boolean'
      ? response.medicationRemindersEnabled
      : defaultPreferences.medicationRemindersEnabled;
  const snoozeMinutes = typeof response.snoozeMinutes === 'number' ? response.snoozeMinutes : defaultPreferences.snoozeMinutes;

  return {
    locale,
    fontScale,
    notificationsEnabled,
    medicationRemindersEnabled,
    snoozeMinutes,
  };
}

export async function loadAppPreferences(): Promise<AppPreferences> {
  try {
    const query = await buildUserReferenceQuery();
    const response = await apiRequestJson<UserPreferencesApiResponse>(`/api/user-preferences${query}`, {
      correlationPrefix: 'user-preferences-get',
    });
    return fromApi(response);
  } catch {
    return defaultPreferences;
  }
}

export async function saveAppPreferences(preferences: AppPreferences): Promise<void> {
  const query = await buildUserReferenceQuery();
  await apiRequestJson<UserPreferencesApiResponse>(`/api/user-preferences${query}`, {
    method: 'PUT',
    body: {
      locale: preferences.locale,
      fontScale: preferences.fontScale,
      notificationsEnabled: preferences.notificationsEnabled,
      medicationRemindersEnabled: preferences.medicationRemindersEnabled,
      snoozeMinutes: preferences.snoozeMinutes,
    },
    correlationPrefix: 'user-preferences-put',
  });
}

export async function updateLocalePreference(locale: Locale): Promise<void> {
  const query = await buildUserReferenceQuery();
  await apiRequestJson<UserPreferencesApiResponse>(`/api/user-preferences${query}`, {
    method: 'PUT',
    body: {
      locale,
    },
    correlationPrefix: 'user-preferences-put-locale',
  });
}

export async function updateReminderPreferences(
  patch: Partial<Pick<AppPreferences, 'notificationsEnabled' | 'medicationRemindersEnabled' | 'snoozeMinutes'>>,
): Promise<void> {
  const query = await buildUserReferenceQuery();
  await apiRequestJson<UserPreferencesApiResponse>(`/api/user-preferences${query}`, {
    method: 'PUT',
    body: {
      notificationsEnabled: patch.notificationsEnabled,
      medicationRemindersEnabled: patch.medicationRemindersEnabled,
      snoozeMinutes: patch.snoozeMinutes,
    },
    correlationPrefix: 'user-preferences-put-reminders',
  });
}

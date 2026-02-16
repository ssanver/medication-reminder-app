import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { currentUser } from '../profile/current-user';
import { createCorrelationId } from '../network/correlation-id';

type ReportSystemErrorInput = {
  errorType: string;
  message: string;
  stackTrace?: string;
};

function getApiBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:5047';
}

function getAppVersion(): string {
  return Constants.expoConfig?.version ?? '0.1.0';
}

function getLocale(): string {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    return locale || 'en-US';
  } catch {
    return 'en-US';
  }
}

export async function reportSystemError(input: ReportSystemErrorInput): Promise<void> {
  try {
    await fetch(`${getApiBaseUrl()}/api/system-errors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': createCorrelationId('sys-err'),
      },
      body: JSON.stringify({
        userReference: currentUser.email,
        appVersion: getAppVersion(),
        platform: Platform.OS,
        device: `${Platform.OS}-${Platform.Version}`,
        locale: getLocale(),
        errorType: input.errorType,
        message: input.message.slice(0, 1000),
        stackTrace: input.stackTrace?.slice(0, 4000),
        occurredAt: new Date().toISOString(),
      }),
    });
  } catch {
    // Prevent cascading failures while reporting errors.
  }
}

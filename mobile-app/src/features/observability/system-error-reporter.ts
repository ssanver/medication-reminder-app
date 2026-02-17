import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { currentUser } from '../profile/current-user';
import { apiRequestVoid } from '../network/api-client';

type ReportSystemErrorInput = {
  errorType: string;
  message: string;
  stackTrace?: string;
};

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
    await apiRequestVoid('/api/system-errors', {
      method: 'POST',
      correlationPrefix: 'sys-err',
      body: {
        userReference: currentUser.email,
        appVersion: getAppVersion(),
        platform: Platform.OS,
        device: `${Platform.OS}-${Platform.Version}`,
        locale: getLocale(),
        errorType: input.errorType,
        message: input.message.slice(0, 1000),
        stackTrace: input.stackTrace?.slice(0, 4000),
        occurredAt: new Date().toISOString(),
      },
    });
  } catch {
    // Prevent cascading failures while reporting errors.
  }
}

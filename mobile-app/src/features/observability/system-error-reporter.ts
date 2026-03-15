import { Platform } from 'react-native';
import { resolveUserReference } from '../auth/user-reference';
import { apiRequestVoid } from '../network/api-client';
import { getAppVersionForPayload } from '../app/app-version';

type ReportSystemErrorInput = {
  errorType: string;
  message: string;
  stackTrace?: string;
};

function getAppVersion(): string {
  return getAppVersionForPayload();
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
    const userReference = await resolveUserReference();
    await apiRequestVoid('/api/system-errors', {
      method: 'POST',
      correlationPrefix: 'sys-err',
      body: {
        userReference,
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

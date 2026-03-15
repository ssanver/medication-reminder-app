import { Platform } from 'react-native';
import { apiRequestVoid } from '../network/api-client';
import { resolveUserReference } from '../auth/user-reference';
import { getAppVersionForPayload } from '../app/app-version';

export type FeedbackCategory = 'notification-problem' | 'add-medication-problem' | 'suggestion' | 'other';

export async function submitFeedback(category: FeedbackCategory, message: string): Promise<void> {
  const userReference = await resolveUserReference();
  await apiRequestVoid('/api/feedback', {
    method: 'POST',
    correlationPrefix: 'feedback',
    body: {
      category,
      message,
      userId: userReference,
      appVersion: getAppVersionForPayload(),
      osVersion: `${Platform.Version ?? ''}`,
      deviceModel: Platform.OS,
      notificationPermission: true,
    },
  });
}

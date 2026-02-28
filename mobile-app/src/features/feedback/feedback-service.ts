import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiRequestVoid } from '../network/api-client';
import { resolveUserReference } from '../auth/user-reference';

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
      appVersion: Constants.expoConfig?.version ?? '0.1.0',
      osVersion: `${Platform.Version ?? ''}`,
      deviceModel: Platform.OS,
      notificationPermission: true,
    },
  });
}

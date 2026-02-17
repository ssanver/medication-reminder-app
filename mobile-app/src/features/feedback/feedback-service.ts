import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { currentUser } from '../profile/current-user';

function getApiBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:5047';
}

export type FeedbackCategory = 'notification-problem' | 'add-medication-problem' | 'suggestion' | 'other';

export async function submitFeedback(category: FeedbackCategory, message: string): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}/api/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      category,
      message,
      userId: currentUser.email,
      appVersion: Constants.expoConfig?.version ?? '0.1.0',
      osVersion: `${Platform.Version ?? ''}`,
      deviceModel: Platform.OS,
      notificationPermission: true,
    }),
  });

  if (!response.ok) {
    const messageText = await response.text();
    throw new Error(messageText || 'Feedback submit failed.');
  }
}

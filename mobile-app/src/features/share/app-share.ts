import { Platform, Share } from 'react-native';

const appStoreUrl = process.env.EXPO_PUBLIC_APP_STORE_URL ?? 'https://apps.apple.com';
const playStoreUrl = process.env.EXPO_PUBLIC_PLAY_STORE_URL ?? 'https://play.google.com/store';

function buildShareMessage(): string {
  return `Medication Reminder\nApp Store: ${appStoreUrl}\nGoogle Play: ${playStoreUrl}`;
}

export async function shareApplication(): Promise<void> {
  const message = buildShareMessage();
  const url = Platform.OS === 'ios' ? appStoreUrl : playStoreUrl;
  await Share.share({
    message,
    url,
  });
}

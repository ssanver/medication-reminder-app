import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldSetBadge: false,
  }),
});

let configured = false;

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

  configured = true;
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

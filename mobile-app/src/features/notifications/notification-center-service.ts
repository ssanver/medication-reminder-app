import { setDoseStatus } from '../medications/medication-store';
import { type Locale } from '../localization/localization';
import { recordNotificationHistory } from './notification-history';
import { dismissReminderPrompt, scheduleDoseFollowUpReminder, type ReminderPrompt } from './local-notifications';

function parseDate(dateKey: string): Date | null {
  const date = new Date(`${dateKey}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function handleReminderTakeNow(reminder: ReminderPrompt): Promise<void> {
  dismissReminderPrompt();
  const date = parseDate(reminder.dateKey);
  await Promise.allSettled([
    date ? setDoseStatus(reminder.medicationId, date, 'taken', reminder.scheduledTime) : Promise.resolve(),
    recordNotificationHistory({
      medicationId: reminder.medicationId,
      dateKey: reminder.dateKey,
      scheduledTime: reminder.scheduledTime,
      medicationName: reminder.medicationName,
      medicationDetails: reminder.medicationDetails,
      action: 'take-now',
    }),
  ]);
}

export async function handleReminderSkip(reminder: ReminderPrompt): Promise<void> {
  dismissReminderPrompt();
  const date = parseDate(reminder.dateKey);
  await Promise.allSettled([
    date ? setDoseStatus(reminder.medicationId, date, 'missed', reminder.scheduledTime) : Promise.resolve(),
    recordNotificationHistory({
      medicationId: reminder.medicationId,
      dateKey: reminder.dateKey,
      scheduledTime: reminder.scheduledTime,
      medicationName: reminder.medicationName,
      medicationDetails: reminder.medicationDetails,
      action: 'skip',
    }),
    scheduleDoseFollowUpReminder(reminder, 5),
  ]);
}

export async function handleReminderSnooze(reminder: ReminderPrompt, snoozeMinutes: number, locale: Locale): Promise<void> {
  dismissReminderPrompt();
  await scheduleDoseFollowUpReminder(reminder, snoozeMinutes, locale);
}

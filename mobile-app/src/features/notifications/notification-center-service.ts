import { setDoseStatus } from '../medications/medication-store';
import { recordNotificationHistory } from './notification-history';
import { dismissReminderPrompt, scheduleDoseFollowUpReminder, type ReminderPrompt } from './local-notifications';

function parseDate(dateKey: string): Date | null {
  const date = new Date(`${dateKey}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function handleReminderTakeNow(reminder: ReminderPrompt): Promise<void> {
  const date = parseDate(reminder.dateKey);
  if (date) {
    await setDoseStatus(reminder.medicationId, date, 'taken', reminder.scheduledTime);
  }

  await recordNotificationHistory({
    medicationId: reminder.medicationId,
    dateKey: reminder.dateKey,
    scheduledTime: reminder.scheduledTime,
    medicationName: reminder.medicationName,
    medicationDetails: reminder.medicationDetails,
    action: 'take-now',
  });

  dismissReminderPrompt();
}

export async function handleReminderSkip(reminder: ReminderPrompt): Promise<void> {
  const date = parseDate(reminder.dateKey);
  if (date) {
    await setDoseStatus(reminder.medicationId, date, 'missed', reminder.scheduledTime);
  }

  await recordNotificationHistory({
    medicationId: reminder.medicationId,
    dateKey: reminder.dateKey,
    scheduledTime: reminder.scheduledTime,
    medicationName: reminder.medicationName,
    medicationDetails: reminder.medicationDetails,
    action: 'skip',
  });

  await scheduleDoseFollowUpReminder(reminder, 5);
  dismissReminderPrompt();
}

export async function handleReminderSnooze(reminder: ReminderPrompt): Promise<void> {
  await scheduleDoseFollowUpReminder(reminder, 5);
  dismissReminderPrompt();
}

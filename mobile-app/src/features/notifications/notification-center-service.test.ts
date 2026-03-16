import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleReminderSkip, handleReminderSnooze, handleReminderTakeNow } from './notification-center-service';

const {
  dismissReminderPrompt,
  scheduleDoseFollowUpReminder,
  setDoseStatus,
  recordNotificationHistory,
} = vi.hoisted(() => ({
  dismissReminderPrompt: vi.fn(),
  scheduleDoseFollowUpReminder: vi.fn(),
  setDoseStatus: vi.fn(),
  recordNotificationHistory: vi.fn(),
}));

vi.mock('./local-notifications', () => ({
  dismissReminderPrompt,
  scheduleDoseFollowUpReminder,
}));

vi.mock('../medications/medication-store', () => ({
  setDoseStatus,
}));

vi.mock('./notification-history', () => ({
  recordNotificationHistory,
}));

describe('notification-center-service', () => {
  const reminder = {
    medicationId: 'med-1',
    dateKey: '2026-03-17',
    scheduledTime: '09:00',
    medicationName: 'Lipantly',
    medicationDetails: '1 Capsule',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('take now aksiyonunda modal hemen kapanir', async () => {
    let releaseStatus: () => void = () => undefined;
    setDoseStatus.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          releaseStatus = resolve;
        }),
    );
    recordNotificationHistory.mockResolvedValue(undefined);

    const actionPromise = handleReminderTakeNow(reminder);

    expect(dismissReminderPrompt).toHaveBeenCalledTimes(1);

    releaseStatus();
    await actionPromise;
  });

  it('skip aksiyonunda modal hemen kapanir', async () => {
    let releaseStatus: () => void = () => undefined;
    setDoseStatus.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          releaseStatus = resolve;
        }),
    );
    recordNotificationHistory.mockResolvedValue(undefined);
    scheduleDoseFollowUpReminder.mockResolvedValue(undefined);

    const actionPromise = handleReminderSkip(reminder);

    expect(dismissReminderPrompt).toHaveBeenCalledTimes(1);

    releaseStatus();
    await actionPromise;
  });

  it('snooze aksiyonunda modal zamanlamadan once kapanir', async () => {
    let releaseSchedule: () => void = () => undefined;
    scheduleDoseFollowUpReminder.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          releaseSchedule = resolve;
        }),
    );

    const actionPromise = handleReminderSnooze(reminder, 10, 'tr');

    expect(dismissReminderPrompt).toHaveBeenCalledTimes(1);

    releaseSchedule();
    await actionPromise;
  });
});

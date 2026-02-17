import { localizeFrequencyLabel } from '../localization/medication-localization';
import { getLocaleTag, type Locale } from '../localization/localization';

export type WizardStep = 'name' | 'form-dose' | 'frequency' | 'note';
export type IntervalUnit = 'day' | 'week';

export type FormOption = {
  key: string;
  emoji: string;
};

export const steps: WizardStep[] = ['name', 'form-dose', 'frequency', 'note'];
export const dosageOptions = ['0.5', '1', '2', '3'];
export const defaultDoseTimes = ['09:00', '14:00', '20:00'];
export const dayIntervalOptions = [1, 2, 3] as const;
export const weekIntervalOptions = [1, 2] as const;
export const dosesPerDayOptions = [1, 2, 3] as const;
export const weekdayOptions = [1, 2, 3, 4, 5, 6, 0] as const;
export const hourOptions = Array.from({ length: 24 }, (_, hour) => `${hour}`.padStart(2, '0'));
export const minuteOptions = Array.from({ length: 12 }, (_, index) => `${index * 5}`.padStart(2, '0'));
export const medicationIconOptions = ['💊', '🧴', '💉', '🫙', '🩹', '🌿', '🟡', '🔵'];

export const formOptions: FormOption[] = [
  { key: 'Capsule', emoji: '💊' },
  { key: 'Pill', emoji: '💊' },
  { key: 'Drop', emoji: '🫙' },
  { key: 'Syrup', emoji: '🧴' },
  { key: 'Injection', emoji: '💉' },
  { key: 'Other', emoji: '•••' },
];

export const medicationSuggestions = ['Metformin', 'Metoprolol tartrate', 'Methotrexate', 'Methadone', 'Metolazone'];

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export function shiftMonth(base: Date, delta: number): Date {
  return new Date(base.getFullYear(), base.getMonth() + delta, 1);
}

export function buildCalendarCells(month: Date): Array<Date | null> {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const mondayStartOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: Array<Date | null> = Array.from({ length: mondayStartOffset }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, monthIndex, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

export function toFrequencyLabel(dayInterval: number): string {
  if (dayInterval === 2) {
    return 'Every 2 Days';
  }

  if (dayInterval === 3) {
    return 'Every 3 Days';
  }

  if (dayInterval === 7) {
    return 'Every 7 Days';
  }

  if (dayInterval === 14) {
    return 'Every 14 Days';
  }

  return 'Every 1 Day';
}

export function getDayIntervalLabel(dayInterval: number, locale: Locale): string {
  return localizeFrequencyLabel(toFrequencyLabel(dayInterval), locale);
}

export function resolveDayInterval(intervalUnit: IntervalUnit, intervalCount: number): number {
  return intervalUnit === 'week' ? intervalCount * 7 : intervalCount;
}

export function getWeekdayLabel(weekday: number, locale: Locale): string {
  const anchor = new Date(2026, 0, 5 + weekday);
  return anchor.toLocaleDateString(getLocaleTag(locale), { weekday: 'short' });
}

export function alignDateToWeekday(baseDate: string, weekday: number): string {
  const date = parseDateKey(baseDate);
  const current = date.getDay();
  const offset = (weekday - current + 7) % 7;
  const aligned = new Date(date);
  aligned.setDate(date.getDate() + offset);
  return formatDate(aligned);
}

export function splitTime(value: string): { hour: string; minute: string } {
  const [rawHour = '09', rawMinute = '00'] = value.split(':');
  const hour = `${Math.min(23, Math.max(0, Number(rawHour)))}`.padStart(2, '0');
  const minute = `${Math.min(59, Math.max(0, Number(rawMinute)))}`.padStart(2, '0');
  return { hour, minute };
}

export function resolveFormDefaultIcon(formKey: string): string {
  return formOptions.find((item) => item.key === formKey)?.emoji ?? '🧴';
}

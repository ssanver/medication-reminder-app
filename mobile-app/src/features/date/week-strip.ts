import { type Locale } from '../localization/localization';

export type WeekDayItem = {
  key: string;
  label: string;
  dateLabel: string;
  date: Date;
  isSelected: boolean;
  isToday: boolean;
};

function getLocaleTag(locale: Locale): string {
  return locale === 'tr' ? 'tr-TR' : 'en-US';
}

export function getStartOfWeek(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);

  return start;
}

export function getDateTitle(selectedDate: Date, locale: Locale): string {
  const localeTag = getLocaleTag(locale);
  const dateText = new Intl.DateTimeFormat(localeTag, { day: 'numeric', month: 'long' }).format(selectedDate);

  return locale === 'tr' ? `Bugun, ${dateText}` : `Today, ${dateText}`;
}

function getWeekDayLabel(date: Date, locale: Locale): string {
  const localeTag = getLocaleTag(locale);
  const label = new Intl.DateTimeFormat(localeTag, { weekday: 'short' }).format(date);
  return label.replace('.', '').slice(0, 1).toLocaleUpperCase(localeTag);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getWeekStrip(selectedDate: Date, locale: Locale): WeekDayItem[] {
  const start = getStartOfWeek(selectedDate);
  const today = new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);

    return {
      key: `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`,
      label: getWeekDayLabel(day, locale),
      dateLabel: `${day.getDate()}`,
      date: day,
      isSelected: isSameDay(day, selectedDate),
      isToday: isSameDay(day, today),
    };
  });
}

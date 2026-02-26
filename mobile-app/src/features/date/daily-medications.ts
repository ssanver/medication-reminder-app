import { getLocaleTag, getTranslations, type Locale } from '../localization/localization';

export type DoseStatusFilter = 'All' | 'Taken' | 'Missed';
export type DoseRuntimeStatus = 'taken' | 'missed' | 'pending';

export type DoseItem = {
  id: string;
  name: string;
  details: string;
  schedule: string;
  status: DoseRuntimeStatus;
  emoji: string;
};

type MedicationPlan = {
  id: string;
  name: string;
  details: string;
  emoji: string;
  time: string;
  cadenceLabel: string;
  recurrence: 'daily' | 'weekdays' | 'days-of-week' | 'every-n-days';
  daysOfWeek?: number[];
  everyNDays?: number;
  anchorDate: string;
};

function normalizeDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(from: Date, to: Date): number {
  const ms = normalizeDay(to).getTime() - normalizeDay(from).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function isPlanScheduledOnDate(plan: MedicationPlan, selectedDate: Date): boolean {
  const normalizedDate = normalizeDay(selectedDate);
  const dayOfWeek = normalizedDate.getDay();

  if (plan.recurrence === 'daily') {
    return true;
  }

  if (plan.recurrence === 'weekdays') {
    return dayOfWeek >= 1 && dayOfWeek <= 5;
  }

  if (plan.recurrence === 'days-of-week') {
    return (plan.daysOfWeek ?? []).includes(dayOfWeek);
  }

  const everyNDays = plan.everyNDays ?? 1;
  const anchorDate = new Date(plan.anchorDate);
  const diff = daysBetween(anchorDate, normalizedDate);
  return diff >= 0 && diff % everyNDays === 0;
}

function compareByDay(a: Date, b: Date): number {
  const d1 = normalizeDay(a).getTime();
  const d2 = normalizeDay(b).getTime();
  if (d1 === d2) {
    return 0;
  }
  return d1 < d2 ? -1 : 1;
}

function resolveStatus(selectedDate: Date): DoseRuntimeStatus {
  const today = new Date();
  const dayCompare = compareByDay(selectedDate, today);

  if (dayCompare > 0) {
    return 'pending';
  }

  if (dayCompare < 0) {
    return 'missed';
  }

  const currentHour = today.getHours();
  const plannedHour = 23;

  if (currentHour < plannedHour) {
    return 'pending';
  }

  return 'missed';
}

export function getMedicationSectionTitle(selectedDate: Date, locale: Locale): string {
  const localeTag = getLocaleTag(locale);
  const dateText = new Intl.DateTimeFormat(localeTag, { day: 'numeric', month: 'long' }).format(selectedDate);
  const t = getTranslations(locale);

  return `${dateText} ${t.todaysMedication}`;
}

export function getDosesForDate(selectedDate: Date, plans: MedicationPlan[] = []): DoseItem[] {
  const dayToken = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;

  return plans
    .filter((plan) => isPlanScheduledOnDate(plan, selectedDate))
    .map((plan) => ({
      id: `${plan.id}-${dayToken}`,
      name: plan.name,
      details: plan.details,
      schedule: `${plan.time} | ${plan.cadenceLabel}`,
      status: resolveStatus(selectedDate),
      emoji: plan.emoji,
    }));
}

export function getDoseCounts(doses: DoseItem[]): { all: number; taken: number; missed: number } {
  return {
    all: doses.length,
    taken: doses.filter((dose) => dose.status === 'taken').length,
    missed: doses.filter((dose) => dose.status === 'missed').length,
  };
}

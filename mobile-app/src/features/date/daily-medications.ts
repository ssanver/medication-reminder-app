import { type Locale } from '../localization/localization';

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

const medicationPlans: MedicationPlan[] = [
  {
    id: 'metformin',
    name: 'Metformin',
    details: '1 Capsules',
    emoji: '💊',
    time: '09:00',
    cadenceLabel: 'Daily',
    recurrence: 'daily',
    anchorDate: '2026-01-01',
  },
  {
    id: 'captopril',
    name: 'Captopril',
    details: '2 Capsules',
    emoji: '🧴',
    time: '20:00',
    cadenceLabel: 'Daily',
    recurrence: 'weekdays',
    anchorDate: '2026-01-01',
  },
  {
    id: 'b12',
    name: 'B 12',
    details: '1 Injection',
    emoji: '💉',
    time: '22:00',
    cadenceLabel: 'Mon/Wed/Fri',
    recurrence: 'days-of-week',
    daysOfWeek: [1, 3, 5],
    anchorDate: '2026-01-01',
  },
  {
    id: 'idrop',
    name: 'I-DROP MGD',
    details: '2 Drops',
    emoji: '🫙',
    time: '22:00',
    cadenceLabel: 'Every 2 Days',
    recurrence: 'every-n-days',
    everyNDays: 2,
    anchorDate: '2026-01-03',
  },
  {
    id: 'niacin',
    name: 'Niacin',
    details: '0.5 Pill',
    emoji: '🧪',
    time: '22:00',
    cadenceLabel: 'Tue/Thu/Sat',
    recurrence: 'days-of-week',
    daysOfWeek: [2, 4, 6],
    anchorDate: '2026-01-01',
  },
];

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

function seededNumber(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  }
  return hash;
}

function resolveStatus(plan: MedicationPlan, selectedDate: Date): DoseRuntimeStatus {
  const today = new Date();
  const dayCompare = compareByDay(selectedDate, today);

  if (dayCompare > 0) {
    return 'pending';
  }

  const dayKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}-${plan.id}`;
  const value = seededNumber(dayKey) % 100;

  if (dayCompare < 0) {
    if (value < 55) {
      return 'taken';
    }

    if (value < 85) {
      return 'missed';
    }

    return 'pending';
  }

  const currentHour = today.getHours();
  const plannedHour = Number(plan.time.split(':')[0] ?? '0');

  if (currentHour < plannedHour) {
    return 'pending';
  }

  if (value < 65) {
    return 'taken';
  }

  return 'pending';
}

export function getMedicationSectionTitle(selectedDate: Date, locale: Locale): string {
  const localeTag = locale === 'tr' ? 'tr-TR' : 'en-US';
  const dateText = new Intl.DateTimeFormat(localeTag, { day: 'numeric', month: 'long' }).format(selectedDate);

  return locale === 'tr' ? `${dateText} Ilaclari` : `Medication on ${dateText}`;
}

export function getDosesForDate(selectedDate: Date): DoseItem[] {
  const dayToken = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;

  return medicationPlans
    .filter((plan) => isPlanScheduledOnDate(plan, selectedDate))
    .map((plan) => ({
      id: `${plan.id}-${dayToken}`,
      name: plan.name,
      details: plan.details,
      schedule: `${plan.time} | ${plan.cadenceLabel}`,
      status: resolveStatus(plan, selectedDate),
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


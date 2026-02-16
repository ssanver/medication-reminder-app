import AsyncStorage from '@react-native-async-storage/async-storage';
import { localizeFrequencyLabel } from '../localization/medication-localization';
import { getLocaleTag, type Locale } from '../localization/localization';

export type MedicationRecurrence = 'daily' | 'every-2-days' | 'every-3-days' | 'every-8-hours' | 'every-12-hours' | 'hourly';
export type DoseStatus = 'taken' | 'missed';

export type Medication = {
  id: string;
  name: string;
  form: string;
  dosage: string;
  frequencyLabel: string;
  recurrence: MedicationRecurrence;
  note: string;
  startDate: string;
  time: string;
  times?: string[];
  active: boolean;
};

type DoseEvent = {
  medicationId: string;
  dateKey: string;
  scheduledTime: string;
  status: DoseStatus;
};

type MedicationStoreState = {
  medications: Medication[];
  events: DoseEvent[];
  isHydrated: boolean;
};

const STORAGE_KEY = 'medication-reminder-store-v1';
const listeners = new Set<() => void>();

const defaultMedications: Medication[] = [
  {
    id: 'metformin',
    name: 'Metformin',
    form: 'Capsule',
    dosage: '1',
    frequencyLabel: 'Every 1 Day',
    recurrence: 'daily',
    note: '',
    startDate: '2026-01-01',
    time: '09:00',
    active: true,
  },
  {
    id: 'captopril',
    name: 'Captopril',
    form: 'Capsule',
    dosage: '2',
    frequencyLabel: 'Every 1 Day',
    recurrence: 'daily',
    note: '',
    startDate: '2026-01-01',
    time: '20:00',
    active: true,
  },
  {
    id: 'b12',
    name: 'B 12',
    form: 'Injection',
    dosage: '1',
    frequencyLabel: 'Every 3 Days',
    recurrence: 'every-3-days',
    note: '',
    startDate: '2026-01-03',
    time: '22:00',
    active: true,
  },
];

let state: MedicationStoreState = {
  medications: defaultMedications,
  events: [],
  isHydrated: false,
};

function emit() {
  listeners.forEach((listener) => listener());
}

function normalize(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toDateKey(date: Date): string {
  const d = normalize(date);
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00`);
}

function diffDays(from: Date, to: Date): number {
  const ms = normalize(to).getTime() - normalize(from).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function recurrenceFromLabel(label: string): MedicationRecurrence {
  if (label === 'Every 2 Days') {
    return 'every-2-days';
  }

  if (label === 'Every 3 Days') {
    return 'every-3-days';
  }

  if (label === 'Every 8 Hours') {
    return 'every-8-hours';
  }

  if (label === 'Every 12 Hours') {
    return 'every-12-hours';
  }

  if (label === 'Every 1 Hour') {
    return 'hourly';
  }

  return 'daily';
}

function normalizeTime(value: string): string {
  const [rawHour = '0', rawMinute = '0'] = value.split(':');
  const hour = Math.min(23, Math.max(0, Number(rawHour)));
  const minute = Math.min(59, Math.max(0, Number(rawMinute)));
  return `${`${hour}`.padStart(2, '0')}:${`${minute}`.padStart(2, '0')}`;
}

function getMedicationTimes(medication: Medication): string[] {
  const candidates = (Array.isArray(medication.times) && medication.times.length > 0 ? medication.times : [medication.time ?? '09:00'])
    .map((item) => normalizeTime(item))
    .filter((item, index, list) => list.indexOf(item) === index);
  return candidates.sort((a, b) => a.localeCompare(b));
}

function normalizeMedication(payload: Medication): Medication {
  const normalizedTimes = getMedicationTimes(payload);
  return {
    ...payload,
    time: normalizedTimes[0] ?? '09:00',
    times: normalizedTimes,
  };
}

function toPersistableState() {
  return {
    medications: state.medications,
    events: state.events,
  };
}

async function persist() {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toPersistableState()));
}

export async function hydrateMedicationStore(): Promise<void> {
  if (state.isHydrated) {
    return;
  }

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);

    if (raw) {
      const parsed = JSON.parse(raw) as {
        medications?: Medication[];
        events?: Array<Omit<DoseEvent, 'scheduledTime'> & Partial<Pick<DoseEvent, 'scheduledTime'>>>;
      };
      state = {
        medications:
          parsed.medications && parsed.medications.length > 0
            ? parsed.medications.map((item) => normalizeMedication(item))
            : defaultMedications.map((item) => normalizeMedication(item)),
        events:
          parsed.events?.map((item) => ({
            medicationId: item.medicationId,
            dateKey: item.dateKey,
            scheduledTime: typeof item.scheduledTime === 'string' ? normalizeTime(item.scheduledTime) : '',
            status: item.status,
          })) ?? [],
        isHydrated: true,
      };
      emit();
      return;
    }
  } catch {
    // Fallback to in-memory defaults when persisted payload is unavailable/corrupt.
  }

  state = {
    ...state,
    isHydrated: true,
  };
  emit();
}

export function subscribeMedicationStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getMedicationStoreSnapshot(): MedicationStoreState {
  return state;
}

export async function addMedication(payload: {
  name: string;
  form: string;
  frequencyLabel: string;
  dosage: string;
  note: string;
  startDate?: string;
  time?: string;
  times?: string[];
  active?: boolean;
}): Promise<void> {
  const id = `med-${Date.now()}`;
  const today = toDateKey(new Date());
  const normalizedTimes = (payload.times && payload.times.length > 0 ? payload.times : [payload.time ?? '09:00']).map((item) => normalizeTime(item));
  const medication: Medication = {
    id,
    name: payload.name.trim(),
    form: payload.form,
    dosage: payload.dosage.trim().split(' - ')[0] ?? payload.dosage.trim(),
    frequencyLabel: payload.frequencyLabel,
    recurrence: recurrenceFromLabel(payload.frequencyLabel),
    note: payload.note.trim(),
    startDate: payload.startDate ?? today,
    time: normalizedTimes[0] ?? '09:00',
    times: normalizedTimes,
    active: payload.active ?? true,
  };

  state = {
    ...state,
    medications: [medication, ...state.medications],
  };
  emit();
  await persist();
}

export function getMedicationById(medicationId: string): Medication | undefined {
  return state.medications.find((item) => item.id === medicationId);
}

export async function updateMedication(
  medicationId: string,
  patch: Partial<Pick<Medication, 'name' | 'form' | 'dosage' | 'frequencyLabel' | 'note' | 'startDate' | 'time' | 'times' | 'active'>>,
): Promise<void> {
  state = {
    ...state,
    medications: state.medications.map((item) =>
      item.id === medicationId
        ? {
            ...normalizeMedication({
              ...item,
              ...patch,
            }),
            recurrence: patch.frequencyLabel ? recurrenceFromLabel(patch.frequencyLabel) : item.recurrence,
          }
        : item,
    ),
  };
  emit();
  await persist();
}

export async function setMedicationActive(medicationId: string, active: boolean): Promise<void> {
  state = {
    ...state,
    medications: state.medications.map((item) => (item.id === medicationId ? { ...item, active } : item)),
  };
  emit();
  await persist();
}

export async function setDoseStatus(medicationId: string, date: Date, status: DoseStatus, scheduledTime = ''): Promise<void> {
  const dateKey = toDateKey(date);
  const normalizedScheduledTime = normalizeTime(scheduledTime || '00:00');
  const existing = state.events.find(
    (item) => item.medicationId === medicationId && item.dateKey === dateKey && item.scheduledTime === normalizedScheduledTime,
  );

  if (existing) {
    state = {
      ...state,
      events: state.events.map((item) =>
        item.medicationId === medicationId && item.dateKey === dateKey && item.scheduledTime === normalizedScheduledTime
          ? { ...item, status }
          : item,
      ),
    };
  } else {
    state = {
      ...state,
      events: [...state.events, { medicationId, dateKey, scheduledTime: normalizedScheduledTime, status }],
    };
  }

  emit();
  await persist();
}

export async function clearDoseStatus(medicationId: string, date: Date, scheduledTime = ''): Promise<void> {
  const dateKey = toDateKey(date);
  const normalizedScheduledTime = normalizeTime(scheduledTime || '00:00');
  state = {
    ...state,
    events: state.events.filter(
      (item) => !(item.medicationId === medicationId && item.dateKey === dateKey && item.scheduledTime === normalizedScheduledTime),
    ),
  };
  emit();
  await persist();
}

function recurrenceIntervalDays(recurrence: MedicationRecurrence): number {
  if (recurrence === 'every-2-days') {
    return 2;
  }

  if (recurrence === 'every-3-days') {
    return 3;
  }

  return 1;
}

function isScheduled(medication: Medication, date: Date): boolean {
  const dayDiff = diffDays(parseDateKey(medication.startDate), date);

  if (dayDiff < 0) {
    return false;
  }

  if (
    medication.recurrence === 'daily' ||
    medication.recurrence === 'hourly' ||
    medication.recurrence === 'every-8-hours' ||
    medication.recurrence === 'every-12-hours'
  ) {
    return true;
  }

  return dayDiff % recurrenceIntervalDays(medication.recurrence) === 0;
}

function compareDay(a: Date, b: Date): number {
  const da = normalize(a).getTime();
  const db = normalize(b).getTime();

  if (da === db) {
    return 0;
  }

  return da < db ? -1 : 1;
}

export type ScheduledDoseItem = {
  id: string;
  medicationId: string;
  scheduledTime: string;
  name: string;
  details: string;
  schedule: string;
  status: 'taken' | 'missed' | 'pending';
  emoji: string;
};

function iconForForm(form: string): string {
  const lower = form.toLowerCase();
  if (lower === 'drop') {
    return '🫙';
  }

  if (lower === 'injection') {
    return '💉';
  }

  if (lower === 'pill') {
    return '💊';
  }

  return '🧴';
}

export function getScheduledDosesForDate(date: Date, locale: Locale = 'en'): ScheduledDoseItem[] {
  const today = new Date();
  const dayCompare = compareDay(date, today);
  const dateKey = toDateKey(date);

  return state.medications
    .filter((medication) => medication.active && isScheduled(medication, date))
    .flatMap((medication) => {
      const detailsUnit = medication.form.toLowerCase() === 'drop' ? 'Drops' : medication.form.toLowerCase() === 'injection' ? 'Injection' : 'Capsules';

      return getMedicationTimes(medication).map((scheduledTime) => {
        const event = state.events.find(
          (item) => item.medicationId === medication.id && item.dateKey === dateKey && item.scheduledTime === scheduledTime,
        );
        const status: ScheduledDoseItem['status'] = event ? event.status : dayCompare < 0 ? 'missed' : 'pending';

        return {
          id: `${medication.id}-${dateKey}-${scheduledTime}`,
          medicationId: medication.id,
          scheduledTime,
          name: medication.name,
          details: `${medication.dosage} ${detailsUnit}`,
          schedule: `${scheduledTime} | ${localizeFrequencyLabel(medication.frequencyLabel, locale)}`,
          status,
          emoji: iconForForm(medication.form),
        };
      });
    })
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
}

export function getAdherenceSummary(referenceDate: Date): {
  adherence: number;
  totalScheduled: number;
  taken: number;
  missed: number;
} {
  let totalScheduled = 0;
  let taken = 0;
  let missed = 0;

  for (let i = 0; i < 7; i += 1) {
    const date = new Date(referenceDate);
    date.setDate(referenceDate.getDate() - i);

    const doses = getScheduledDosesForDate(date);
    totalScheduled += doses.length;
    taken += doses.filter((item) => item.status === 'taken').length;
    missed += doses.filter((item) => item.status === 'missed').length;
  }

  const adherence = totalScheduled === 0 ? 0 : Math.round((taken / totalScheduled) * 100);

  return {
    adherence,
    totalScheduled,
    taken,
    missed,
  };
}

export function getWeeklyTrend(referenceDate: Date, locale: Locale = 'en'): Array<{ label: string; value: number }> {
  const localeTag = getLocaleTag(locale);
  const out: Array<{ label: string; value: number }> = [];

  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(referenceDate);
    date.setDate(referenceDate.getDate() - i);
    const doses = getScheduledDosesForDate(date);
    const total = doses.length;
    const taken = doses.filter((item) => item.status === 'taken').length;
    const adherence = total === 0 ? 0 : Math.round((taken / total) * 100);
    const weekday = new Intl.DateTimeFormat(localeTag, { weekday: 'short' }).format(date).replace('.', '');
    out.push({
      label: weekday,
      value: adherence,
    });
  }

  return out;
}

export function getMedicationReport(referenceDate: Date): Array<{ medication: string; taken: number; missed: number }> {
  const rows = state.medications.map((item) => ({
    medication: item.name,
    taken: 0,
    missed: 0,
  }));

  for (let i = 0; i < 7; i += 1) {
    const date = new Date(referenceDate);
    date.setDate(referenceDate.getDate() - i);
    const doses = getScheduledDosesForDate(date);

    doses.forEach((dose) => {
      const row = rows.find((item) => item.medication === dose.name);
      if (!row) {
        return;
      }

      if (dose.status === 'taken') {
        row.taken += 1;
      } else if (dose.status === 'missed') {
        row.missed += 1;
      }
    });
  }

  return rows.filter((item) => item.taken > 0 || item.missed > 0);
}

import { apiRequestJson, apiRequestVoid } from '../network/api-client';
import { loadAccessToken } from '../auth/auth-session-store';
import { localizeFrequencyLabel } from '../localization/medication-localization';
import { type Locale } from '../localization/localization';

export type DoseStatus = 'taken' | 'missed';

export type Medication = {
  id: string;
  name: string;
  form: string;
  iconEmoji?: string;
  dosage: string;
  isBeforeMeal: boolean;
  frequencyLabel: string;
  intervalUnit: 'day' | 'week' | 'hour' | 'cycle' | 'as-needed';
  intervalCount: number;
  cycleOffDays?: number;
  note: string;
  startDate: string;
  endDate?: string | null;
  time: string;
  times?: string[];
  weeklyDays?: number[];
  totalQuantity?: number;
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

const listeners = new Set<() => void>();

let state: MedicationStoreState = {
  medications: [],
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

function toFrequencyLabel(
  intervalUnit: Medication['intervalUnit'],
  intervalCount: number,
  cycleOffDays = 0,
): string {
  if (intervalUnit === 'as-needed') {
    return 'Every 1 Day';
  }

  if (intervalUnit === 'hour') {
    return `Every ${Math.max(1, intervalCount)} Hour${Math.max(1, intervalCount) > 1 ? 's' : ''}`;
  }

  if (intervalUnit === 'cycle') {
    return `Cycle ${Math.max(1, intervalCount)}/${Math.max(0, cycleOffDays)}`;
  }

  if (intervalUnit === 'week') {
    return intervalCount === 1 ? 'Every Week' : `Every ${intervalCount} Weeks`;
  }
  if (intervalCount === 3) {
    return 'Every 3 Days';
  }
  if (intervalCount === 2) {
    return 'Every 2 Days';
  }
  return 'Every 1 Day';
}

function parseRuleFromFrequencyLabel(label: string): { intervalUnit: Medication['intervalUnit']; intervalCount: number; cycleOffDays?: number } {
  const normalized = label.trim().toLowerCase();
  if (normalized.includes('as needed')) {
    return { intervalUnit: 'as-needed', intervalCount: 1 };
  }
  if (normalized.includes('hour')) {
    const found = normalized.match(/(\d+)/);
    return { intervalUnit: 'hour', intervalCount: Math.max(1, Number(found?.[1] ?? 1)) };
  }
  if (normalized.startsWith('cycle')) {
    const found = normalized.match(/(\d+)\D+(\d+)/);
    return {
      intervalUnit: 'cycle',
      intervalCount: Math.max(1, Number(found?.[1] ?? 21)),
      cycleOffDays: Math.max(0, Number(found?.[2] ?? 7)),
    };
  }
  if (normalized.includes('14')) {
    return { intervalUnit: 'week', intervalCount: 2 };
  }
  if (normalized.includes('7')) {
    return { intervalUnit: 'week', intervalCount: 1 };
  }
  if (normalized.includes('3')) {
    return { intervalUnit: 'day', intervalCount: 3 };
  }
  if (normalized.includes('2')) {
    return { intervalUnit: 'day', intervalCount: 2 };
  }
  return { intervalUnit: 'day', intervalCount: 1 };
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
  const weeklyDays = Array.from(new Set((payload.weeklyDays ?? []).filter((item) => Number.isInteger(item) && item >= 0 && item <= 6)));
  return {
    ...payload,
    iconEmoji: payload.iconEmoji || iconForForm(payload.form),
    time: normalizedTimes[0] ?? '09:00',
    times: normalizedTimes,
    weeklyDays,
    cycleOffDays: Math.max(0, Number(payload.cycleOffDays ?? 0)),
  };
}

async function persist(): Promise<void> {
  return Promise.resolve();
}

export async function clearMedicationStore(): Promise<void> {
  state = {
    medications: [],
    events: [],
    isHydrated: false,
  };
  emit();
}

type ApiMedicationSchedule = {
  repeatType: string;
  intervalCount?: number;
  reminderTime: string;
  daysOfWeek?: string | null;
};

type ApiMedication = {
  id: string;
  name: string;
  dosage: string;
  usageType?: string | null;
  isBeforeMeal: boolean;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  schedules: ApiMedicationSchedule[];
};

type ApiInventoryRecord = {
  medicationId: string;
  currentStock: number;
  threshold: number;
};

type ApiDoseEvent = {
  id: string;
  medicationId: string;
  actionType: 'taken' | 'missed' | 'snooze' | 'clear';
  dateKey: string;
  scheduledTime: string;
  actionAt: string;
  snoozeMinutes?: number | null;
};

type ApiSaveMedicationRequest = {
  name: string;
  dosage: string;
  usageType?: string;
  isBeforeMeal: boolean;
  startDate: string;
  endDate?: string | null;
  schedules: Array<{
    repeatType: string;
    intervalCount: number;
    reminderTime: string;
    daysOfWeek?: string | null;
  }>;
};

function formatReminderTime(time: string): string {
  const normalized = normalizeTime(time);
  return `${normalized}:00`;
}

function parseReminderTime(time: string): string {
  const [hour = '00', minute = '00'] = time.split(':');
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
}

function weekdayNumberToName(weekday: number): 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' {
  const dayNames: Array<'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'> = [
    'sun',
    'mon',
    'tue',
    'wed',
    'thu',
    'fri',
    'sat',
  ];
  return dayNames[weekday] ?? 'mon';
}

function parseWeekdayName(name: string): number | null {
  const normalized = name.trim().toLowerCase();
  const map: Record<string, number> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  return map[normalized] ?? null;
}

function getWeeklyDays(medication: Medication): number[] {
  const fromMedication = Array.from(
    new Set((medication.weeklyDays ?? []).filter((item) => Number.isInteger(item) && item >= 0 && item <= 6)),
  );
  if (fromMedication.length > 0) {
    return fromMedication.sort((a, b) => a - b);
  }
  return [parseDateKey(medication.startDate).getDay()];
}

function toApiSchedules(medication: Medication): ApiSaveMedicationRequest['schedules'] {
  const times = getMedicationTimes(medication);
  const isWeekly = medication.intervalUnit === 'week';
  const daysOfWeek = isWeekly
    ? getWeeklyDays(medication)
        .map((weekday) => weekdayNumberToName(weekday))
        .join(',')
    : undefined;

  if (medication.intervalUnit === 'as-needed') {
    return times.map((time) => ({
      repeatType: 'daily',
      intervalCount: 1,
      reminderTime: formatReminderTime(time),
      daysOfWeek: null,
    }));
  }

  if (medication.intervalUnit === 'hour') {
    return [
      {
        repeatType: 'hourly',
        intervalCount: Math.max(1, medication.intervalCount),
        reminderTime: formatReminderTime(times[0] ?? '09:00'),
        daysOfWeek: null,
      },
    ];
  }

  if (medication.intervalUnit === 'cycle') {
    const offDays = Math.max(0, Number(medication.cycleOffDays ?? 7));
    return [
      {
        repeatType: 'cycle',
        intervalCount: Math.max(1, medication.intervalCount),
        reminderTime: formatReminderTime(times[0] ?? '09:00'),
        daysOfWeek: `off:${offDays}`,
      },
    ];
  }

  const repeatType = isWeekly ? 'weekly' : 'daily';
  const intervalCount = Math.max(1, medication.intervalCount);
  return times.map((time) => ({
    repeatType,
    intervalCount,
    reminderTime: formatReminderTime(time),
    daysOfWeek,
  }));
}

function toApiSaveMedicationRequest(medication: Medication): ApiSaveMedicationRequest {
  return {
    name: medication.name.trim(),
    dosage: medication.dosage.trim(),
    usageType: medication.form,
    isBeforeMeal: medication.isBeforeMeal,
    startDate: medication.startDate,
    endDate: medication.endDate ?? null,
    schedules: toApiSchedules(medication),
  };
}

function fromApiMedication(item: ApiMedication): Medication {
  const schedules = Array.isArray(item.schedules) ? item.schedules : [];
  const times = schedules.map((schedule) => parseReminderTime(schedule.reminderTime));
  const primaryRepeatType = schedules[0]?.repeatType?.toLowerCase() ?? 'daily';
  const hasWeeklySchedule = primaryRepeatType === 'weekly';
  const isHourlySchedule = primaryRepeatType === 'hourly';
  const isCycleSchedule = primaryRepeatType === 'cycle';
  const isAsNeededSchedule = primaryRepeatType === 'as-needed';
  const intervalCount = Math.max(1, Number(schedules[0]?.intervalCount ?? 1));
  const cycleOffDays = isCycleSchedule ? Math.max(0, Number((schedules[0]?.daysOfWeek ?? 'off:0').split(':')[1] ?? 0)) : 0;
  const weeklyDays = hasWeeklySchedule
    ? Array.from(
        new Set(
          schedules
            .flatMap((schedule) => (schedule.daysOfWeek ?? '').split(','))
            .map((name) => parseWeekdayName(name))
            .filter((day): day is number => day !== null),
        ),
      ).sort((a, b) => a - b)
    : undefined;
  const intervalUnit: Medication['intervalUnit'] = isAsNeededSchedule
    ? 'day'
    : isHourlySchedule
      ? 'hour'
      : isCycleSchedule
        ? 'cycle'
        : hasWeeklySchedule
          ? 'week'
          : 'day';
  const frequencyLabel = toFrequencyLabel(intervalUnit, intervalCount, cycleOffDays);
  const form = item.usageType?.trim() ? item.usageType.trim() : 'Capsule';

  return normalizeMedication({
    id: item.id,
    name: item.name,
    form,
    iconEmoji: iconForForm(form),
    dosage: item.dosage,
    isBeforeMeal: item.isBeforeMeal,
    frequencyLabel,
    intervalUnit,
    intervalCount,
    cycleOffDays,
    note: '',
    startDate: item.startDate,
    endDate: item.endDate ?? null,
    time: times[0] ?? '09:00',
    times,
    weeklyDays,
    totalQuantity: undefined,
    active: item.isActive,
  });
}

async function listInventoryRecords(): Promise<ApiInventoryRecord[]> {
  return apiRequestJson<ApiInventoryRecord[]>('/api/inventory', {
    correlationPrefix: 'inventory-list',
  });
}

async function updateInventoryStock(medicationId: string, totalQuantity: number): Promise<void> {
  await apiRequestJson('/api/inventory/update', {
    method: 'POST',
    body: {
      medicationId,
      currentStock: totalQuantity,
      threshold: Math.max(1, Math.min(5, Math.floor(totalQuantity * 0.2))),
    },
    correlationPrefix: 'inventory-update',
  });
}

async function listDoseEvents(): Promise<ApiDoseEvent[]> {
  return apiRequestJson<ApiDoseEvent[]>('/api/dose-events/history', {
    correlationPrefix: 'dose-events-history',
  });
}

export async function hydrateMedicationStore(): Promise<void> {
  if (state.isHydrated) {
    return;
  }

  const accessToken = await loadAccessToken();
  if (!accessToken) {
    // Auth yokken hydrate edilmez; login sonrası tekrar denenecek.
    return;
  }

  try {
    const remote = await apiRequestJson<ApiMedication[]>('/api/medications', {
      correlationPrefix: 'medication-list',
    });
    const remoteMedications = remote.map(fromApiMedication);
    let inventoryByMedicationId: Record<string, number> = {};
    try {
      const inventoryRecords = await listInventoryRecords();
      inventoryByMedicationId = inventoryRecords.reduce<Record<string, number>>((acc, item) => {
        acc[item.medicationId] = item.currentStock;
        return acc;
      }, {});
    } catch {
      inventoryByMedicationId = {};
    }
    let remoteEvents: DoseEvent[] = [];
    try {
      const eventRecords = await listDoseEvents();
      remoteEvents = eventRecords
        .filter((item) => item.actionType === 'taken' || item.actionType === 'missed')
        .map((item) => ({
          medicationId: item.medicationId,
          dateKey: item.dateKey,
          scheduledTime: normalizeTime(item.scheduledTime || '00:00'),
          status: item.actionType === 'taken' ? 'taken' : 'missed',
        }));
    } catch {
      remoteEvents = [];
    }

    state = {
      medications: remoteMedications.map((item) => ({
        ...item,
        totalQuantity: inventoryByMedicationId[item.id],
      })),
      events: remoteEvents,
      isHydrated: true,
    };
    emit();
    return;
  } catch {
    // Keep medication list empty when API is unreachable.
  }

  state = {
    medications: [],
    events: [],
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
  iconEmoji?: string;
  intervalUnit: Medication['intervalUnit'];
  intervalCount: number;
  cycleOffDays?: number;
  dosage: string;
  isBeforeMeal: boolean;
  note: string;
  startDate?: string;
  endDate?: string | null;
  time?: string;
  times?: string[];
  totalQuantity?: number;
  active?: boolean;
  weeklyDays?: number[];
}): Promise<void> {
  const today = toDateKey(new Date());
  const normalizedTimes = (payload.times && payload.times.length > 0 ? payload.times : [payload.time ?? '09:00']).map((item) => normalizeTime(item));
  const medicationDraft: Medication = {
    id: 'draft-id',
    name: payload.name.trim(),
    form: payload.form,
    iconEmoji: payload.iconEmoji || iconForForm(payload.form),
    dosage: payload.dosage.trim().split(' - ')[0] ?? payload.dosage.trim(),
    isBeforeMeal: payload.isBeforeMeal,
    frequencyLabel: toFrequencyLabel(payload.intervalUnit, payload.intervalCount),
    intervalUnit: payload.intervalUnit,
    intervalCount: Math.max(1, payload.intervalCount),
    cycleOffDays: Math.max(0, Number(payload.cycleOffDays ?? 0)),
    note: payload.note.trim(),
    startDate: payload.startDate ?? today,
    endDate: payload.endDate ?? null,
    time: normalizedTimes[0] ?? '09:00',
    times: normalizedTimes,
    weeklyDays: payload.weeklyDays,
    totalQuantity: payload.totalQuantity,
    active: payload.active ?? true,
  };
  const created = await apiRequestJson<ApiMedication>('/api/medications', {
    method: 'POST',
    body: toApiSaveMedicationRequest(medicationDraft),
    correlationPrefix: 'medication-create',
  });
  const medication = fromApiMedication(created);
  if (typeof payload.totalQuantity === 'number' && Number.isFinite(payload.totalQuantity) && payload.totalQuantity > 0) {
    await updateInventoryStock(medication.id, Math.floor(payload.totalQuantity));
    medication.totalQuantity = Math.floor(payload.totalQuantity);
  }

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
  patch: Partial<
    Pick<
      Medication,
      'name' | 'form' | 'iconEmoji' | 'dosage' | 'isBeforeMeal' | 'frequencyLabel' | 'intervalUnit' | 'intervalCount' | 'note' | 'startDate' | 'endDate' | 'time' | 'times' | 'weeklyDays' | 'totalQuantity' | 'active'
      | 'cycleOffDays'
    >
  >,
): Promise<void> {
  const current = state.medications.find((item) => item.id === medicationId);
  if (!current) {
    return;
  }

  const next = normalizeMedication({
    ...current,
    ...patch,
  });
  const fallbackRuleFromLabel = patch.frequencyLabel ? parseRuleFromFrequencyLabel(patch.frequencyLabel) : null;
  const resolvedIntervalUnit = patch.intervalUnit ?? fallbackRuleFromLabel?.intervalUnit ?? next.intervalUnit;
  const resolvedIntervalCount = Math.max(1, patch.intervalCount ?? fallbackRuleFromLabel?.intervalCount ?? next.intervalCount);
  const resolvedCycleOffDays = Math.max(0, patch.cycleOffDays ?? fallbackRuleFromLabel?.cycleOffDays ?? next.cycleOffDays ?? 0);
  const nextWithRule: Medication = {
    ...next,
    intervalUnit: resolvedIntervalUnit,
    intervalCount: resolvedIntervalCount,
    cycleOffDays: resolvedCycleOffDays,
    frequencyLabel: toFrequencyLabel(resolvedIntervalUnit, resolvedIntervalCount, resolvedCycleOffDays),
  };
  try {
    const updated = await apiRequestJson<ApiMedication>(`/api/medications/${medicationId}`, {
      method: 'PUT',
      body: toApiSaveMedicationRequest(nextWithRule),
      correlationPrefix: 'medication-update',
    });
    const updatedMedication = fromApiMedication(updated);
    if (typeof nextWithRule.totalQuantity === 'number' && Number.isFinite(nextWithRule.totalQuantity) && nextWithRule.totalQuantity > 0) {
      await updateInventoryStock(medicationId, Math.floor(nextWithRule.totalQuantity));
      updatedMedication.totalQuantity = Math.floor(nextWithRule.totalQuantity);
    }

    state = {
      ...state,
      medications: state.medications.map((item) => (item.id === medicationId ? updatedMedication : item)),
    };
    emit();
    await persist();
  } catch {
    // Keep local edits usable when backend update fails.
    state = {
      ...state,
      medications: state.medications.map((item) => (item.id === medicationId ? nextWithRule : item)),
    };
    emit();
    await persist();
  }
}

export async function setMedicationActive(medicationId: string, active: boolean): Promise<void> {
  const current = state.medications.find((item) => item.id === medicationId);
  if (!current) {
    return;
  }

  const localUpdated: Medication = {
    ...current,
    active,
  };

  try {
    const updated = await apiRequestJson<ApiMedication>(`/api/medications/${medicationId}`, {
      method: 'PUT',
      body: toApiSaveMedicationRequest(localUpdated),
      correlationPrefix: 'medication-update-active',
    });
    const updatedMedication = fromApiMedication(updated);

    state = {
      ...state,
      medications: state.medications.map((item) => (item.id === medicationId ? updatedMedication : item)),
    };
    emit();
    await persist();
  } catch {
    // Fallback to local status toggle to keep My Meds actions responsive offline.
    state = {
      ...state,
      medications: state.medications.map((item) => (item.id === medicationId ? localUpdated : item)),
    };
    emit();
    await persist();
  }
}

export async function deleteMedication(medicationId: string): Promise<void> {
  await apiRequestVoid(`/api/medications/${medicationId}`, {
    method: 'DELETE',
    correlationPrefix: 'medication-delete',
  });

  state = {
    ...state,
    medications: state.medications.filter((item) => item.id !== medicationId),
    events: state.events.filter((item) => item.medicationId !== medicationId),
  };
  emit();
  await persist();
}

export async function setDoseStatus(medicationId: string, date: Date, status: DoseStatus, scheduledTime = ''): Promise<void> {
  const dateKey = toDateKey(date);
  const normalizedScheduledTime = normalizeTime(scheduledTime || '00:00');
  await apiRequestJson<ApiDoseEvent>('/api/dose-events/action', {
    method: 'POST',
    body: {
      medicationId,
      actionType: status,
      dateKey,
      scheduledTime: normalizedScheduledTime,
    },
    correlationPrefix: 'dose-events-action',
  });
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
  await apiRequestJson<ApiDoseEvent>('/api/dose-events/action', {
    method: 'POST',
    body: {
      medicationId,
      actionType: 'clear',
      dateKey,
      scheduledTime: normalizedScheduledTime,
    },
    correlationPrefix: 'dose-events-action-clear',
  });
  state = {
    ...state,
    events: state.events.filter(
      (item) => !(item.medicationId === medicationId && item.dateKey === dateKey && item.scheduledTime === normalizedScheduledTime),
    ),
  };
  emit();
  await persist();
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

export function resolveMedicationIcon(form: string, iconEmoji?: string): string {
  return iconEmoji || iconForForm(form);
}

type ApiScheduledDoseResponse = {
  id: string;
  medicationId: string;
  scheduledTime: string;
  dateKey: string;
  name: string;
  dosage: string;
  usageType?: string | null;
  isBeforeMeal: boolean;
  frequencyLabel: string;
  status: 'taken' | 'missed' | 'pending';
};

type ApiDoseSummaryResponse = {
  fromDate: string;
  toDate: string;
  plannedCount: number;
  takenCount: number;
  missedCount: number;
  snoozedCount: number;
  adherenceRate: number;
};

type ApiDoseTrendPointResponse = {
  label: string;
  value: number;
};

type ApiDoseMedicationReportRowResponse = {
  medication: string;
  taken: number;
  missed: number;
};

type ApiDoseReportResponse = {
  summary: ApiDoseSummaryResponse;
  weeklyTrend: ApiDoseTrendPointResponse[];
  medicationRows: ApiDoseMedicationReportRowResponse[];
};

function resolveDoseDetails(dosage: string, usageType?: string | null): string {
  const normalized = (usageType ?? '').trim().toLowerCase();
  const unit = normalized === 'drop' ? 'Drops' : normalized === 'injection' ? 'Injection' : 'Capsules';
  return `${dosage} ${unit}`;
}

export async function getScheduledDosesForDate(date: Date, locale: Locale = 'en'): Promise<ScheduledDoseItem[]> {
  const dateKey = toDateKey(date);
  const query = encodeURIComponent(dateKey);
  const response = await apiRequestJson<ApiScheduledDoseResponse[]>(`/api/dose-events/scheduled-doses?date=${query}`, {
    correlationPrefix: 'dose-events-scheduled',
  });

  return response.map((item) => ({
    id: item.id,
    medicationId: item.medicationId,
    scheduledTime: item.scheduledTime,
    name: item.name,
    details: resolveDoseDetails(item.dosage, item.usageType),
    schedule: `${item.scheduledTime} | ${localizeFrequencyLabel(item.frequencyLabel, locale)}`,
    status: item.status,
    emoji: resolveMedicationIcon(item.usageType?.trim() || 'Capsule'),
  }));
}

export async function getDoseReport(referenceDate: Date, locale: Locale = 'en'): Promise<{
  summary: { adherence: number; totalScheduled: number; taken: number; missed: number };
  weekly: Array<{ label: string; value: number }>;
  medicationRows: Array<{ medication: string; taken: number; missed: number }>;
}> {
  const toDate = toDateKey(referenceDate);
  const fromDateObject = new Date(referenceDate);
  fromDateObject.setDate(referenceDate.getDate() - 6);
  const fromDate = toDateKey(fromDateObject);
  const response = await apiRequestJson<ApiDoseReportResponse>(
    `/api/dose-events/report?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&locale=${encodeURIComponent(locale)}`,
    { correlationPrefix: 'dose-events-report' },
  );

  return {
    summary: {
      adherence: Math.round((response.summary.adherenceRate ?? 0) * 100),
      totalScheduled: response.summary.plannedCount,
      taken: response.summary.takenCount,
      missed: response.summary.missedCount,
    },
    weekly: response.weeklyTrend,
    medicationRows: response.medicationRows,
  };
}

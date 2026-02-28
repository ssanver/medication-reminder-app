import { apiRequestJson } from '../network/api-client';

export type FormOption = {
  key: string;
  emoji: string;
};

export type AppDefinitions = {
  defaultDoseTimes: string[];
  dayIntervalOptions: number[];
  weekIntervalOptions: number[];
  hourIntervalOptions: number[];
  cycleOnDayOptions: number[];
  cycleOffDayOptions: number[];
  dosesPerDayOptions: number[];
  weekdayOptions: number[];
  hourOptions: string[];
  minuteOptions: string[];
  medicationIconOptions: string[];
  formOptions: FormOption[];
  snoozeOptions: number[];
};

type AppDefinitionsApiResponse = {
  definitions: Record<string, string>;
  updatedAt: string;
};

let cachedDefinitions: AppDefinitions | null = null;
let pendingLoad: Promise<AppDefinitions> | null = null;

function parseNumberArray(value: string | undefined): number[] {
  if (!value) {
    return [];
  }

  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
}

function parseStringArray(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((item) => `${item}`.trim())
    .filter((item) => item.length > 0);
}

function parseFormOptions(value: string | undefined): FormOption[] {
  if (!value) {
    return [];
  }

  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const key = typeof item.key === 'string' ? item.key.trim() : '';
      const emoji = typeof item.emoji === 'string' ? item.emoji.trim() : '';
      if (!key || !emoji) {
        return null;
      }

      return { key, emoji };
    })
    .filter((item): item is FormOption => item !== null);
}

function fromApi(response: AppDefinitionsApiResponse): AppDefinitions {
  const source = response.definitions ?? {};

  return {
    defaultDoseTimes: parseStringArray(source.defaultDoseTimes),
    dayIntervalOptions: parseNumberArray(source.dayIntervalOptions),
    weekIntervalOptions: parseNumberArray(source.weekIntervalOptions),
    hourIntervalOptions: parseNumberArray(source.hourIntervalOptions),
    cycleOnDayOptions: parseNumberArray(source.cycleOnDayOptions),
    cycleOffDayOptions: parseNumberArray(source.cycleOffDayOptions),
    dosesPerDayOptions: parseNumberArray(source.dosesPerDayOptions),
    weekdayOptions: parseNumberArray(source.weekdayOptions),
    hourOptions: parseStringArray(source.hourOptions),
    minuteOptions: parseStringArray(source.minuteOptions),
    medicationIconOptions: parseStringArray(source.medicationIconOptions),
    formOptions: parseFormOptions(source.formOptions),
    snoozeOptions: parseNumberArray(source.snoozeOptions),
  };
}

export async function loadAppDefinitions(force = false): Promise<AppDefinitions> {
  if (!force && cachedDefinitions) {
    return cachedDefinitions;
  }

  if (!force && pendingLoad) {
    return pendingLoad;
  }

  pendingLoad = apiRequestJson<AppDefinitionsApiResponse>('/api/app-definitions', {
    correlationPrefix: 'app-definitions-get',
  })
    .then((response) => {
      const parsed = fromApi(response);
      cachedDefinitions = parsed;
      return parsed;
    })
    .finally(() => {
      pendingLoad = null;
    });

  return pendingLoad;
}

export function clearAppDefinitionsCache(): void {
  cachedDefinitions = null;
  pendingLoad = null;
}

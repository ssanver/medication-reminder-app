export type FrequencyIntervalUnit = 'day' | 'week' | 'hour' | 'cycle' | 'as-needed';

export function buildDayFrequencyLabel(dayInterval: number): string {
  const normalizedDayInterval = Math.max(1, Math.floor(dayInterval) || 1);
  return normalizedDayInterval === 1 ? 'Every 1 Day' : `Every ${normalizedDayInterval} Days`;
}

export function buildFrequencyLabel(input: {
  intervalUnit: FrequencyIntervalUnit;
  intervalCount: number;
  cycleOffDays?: number;
}): string {
  const intervalCount = Math.max(1, Math.floor(input.intervalCount) || 1);

  if (input.intervalUnit === 'as-needed') {
    return 'As Needed';
  }

  if (input.intervalUnit === 'hour') {
    return intervalCount === 1 ? 'Every 1 Hour' : `Every ${intervalCount} Hours`;
  }

  if (input.intervalUnit === 'cycle') {
    return `Cycle ${intervalCount}/${Math.max(0, Math.floor(input.cycleOffDays ?? 0) || 0)}`;
  }

  if (input.intervalUnit === 'week') {
    return intervalCount === 1 ? 'Every Week' : `Every ${intervalCount} Weeks`;
  }

  return buildDayFrequencyLabel(intervalCount);
}

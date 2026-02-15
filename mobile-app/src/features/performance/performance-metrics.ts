export function calculateP95(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[Math.max(index, 0)];
}

export function isCriticalScreenP95Valid(values: number[]): boolean {
  return calculateP95(values) < 2000;
}

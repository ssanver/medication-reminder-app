import { describe, expect, it } from 'vitest';
import { calculateP95, isCriticalScreenP95Valid } from './performance-metrics';

describe('performance-metrics', () => {
  it('p95 hesabi dogru yapilmali', () => {
    const p95 = calculateP95([800, 1200, 1500, 1600, 1900, 2100, 2200, 1800, 1700, 2000]);
    expect(p95).toBeGreaterThanOrEqual(2000);
  });

  it('kritik ekran p95 2 saniye altinda olmali', () => {
    expect(isCriticalScreenP95Valid([900, 1000, 1100, 1200, 1300])).toBe(true);
    expect(isCriticalScreenP95Valid([900, 1000, 2100, 2200, 2300])).toBe(false);
  });
});

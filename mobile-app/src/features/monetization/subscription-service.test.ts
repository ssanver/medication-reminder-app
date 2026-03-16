import { describe, expect, it } from 'vitest';
import { mergeMonetizationStatus } from './subscription-service';

describe('subscription service', () => {
  it('store kaynakli aktif premium durumu stale backend sonucuna ezdirmez', () => {
    const result = mergeMonetizationStatus(
      {
        role: 'vip',
        adsEnabled: false,
        activePlanId: 'premium-monthly',
        updatedAt: '2026-03-16T12:00:00.000Z',
      },
      {
        role: 'member',
        adsEnabled: true,
        activePlanId: null,
        updatedAt: '2026-03-16T12:01:00.000Z',
      },
    );

    expect(result.role).toBe('vip');
    expect(result.adsEnabled).toBe(false);
    expect(result.activePlanId).toBe('premium-monthly');
  });

  it('backend premium durumu geldiginde onu kabul eder', () => {
    const result = mergeMonetizationStatus(
      {
        role: 'member',
        adsEnabled: true,
        activePlanId: null,
        updatedAt: '2026-03-16T12:00:00.000Z',
      },
      {
        role: 'vip',
        adsEnabled: false,
        activePlanId: 'premium-yearly',
        updatedAt: '2026-03-16T12:01:00.000Z',
      },
    );

    expect(result.role).toBe('vip');
    expect(result.activePlanId).toBe('premium-yearly');
  });
});

import { describe, expect, it } from 'vitest';
import { FREE_MEDICATION_LIMIT, canCreateMedication } from './premium-access';

describe('premium access', () => {
  it('free kullanici 3 ilaca kadar ekleyebilir', () => {
    expect(canCreateMedication('visitor', FREE_MEDICATION_LIMIT - 1)).toBe(true);
    expect(canCreateMedication('member', FREE_MEDICATION_LIMIT - 1)).toBe(true);
  });

  it('free kullanici 4. ilacta premium gerektirir', () => {
    expect(canCreateMedication('visitor', FREE_MEDICATION_LIMIT)).toBe(false);
    expect(canCreateMedication('member', FREE_MEDICATION_LIMIT)).toBe(false);
  });

  it('vip kullanici sinirsiz ilac ekleyebilir', () => {
    expect(canCreateMedication('vip', FREE_MEDICATION_LIMIT)).toBe(true);
    expect(canCreateMedication('vip', FREE_MEDICATION_LIMIT + 10)).toBe(true);
  });
});

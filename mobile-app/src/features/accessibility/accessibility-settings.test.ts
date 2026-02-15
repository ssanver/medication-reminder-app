import { describe, expect, it } from 'vitest';
import { contrastRatio, fontScaleLevels, isContrastCompliant, isFontScaleLevelValid } from './accessibility-settings';

describe('accessibility-settings', () => {
  it('en az 3 font scale seviyesi sunmali', () => {
    expect(fontScaleLevels.length).toBeGreaterThanOrEqual(3);
    expect(isFontScaleLevelValid(1.15)).toBe(true);
  });

  it('kontrast kontrolu buyuk ve normal metin icin farkli esik kullanmali', () => {
    const ratio = contrastRatio(1, 0.1);

    expect(isContrastCompliant(ratio, false)).toBe(true);
    expect(isContrastCompliant(3.2, true)).toBe(true);
    expect(isContrastCompliant(3.2, false)).toBe(false);
  });
});

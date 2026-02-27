import { describe, expect, it } from 'vitest';
import { getFrequencySummary } from './add-medication-use-case';

describe('add-medication-use-case/getFrequencySummary', () => {
  it('turkce metni interval ve doz sayisina gore uretir', () => {
    expect(getFrequencySummary(1, 2, 'tr')).toBe('Her gün 2 kez');
    expect(getFrequencySummary(2, 3, 'tr')).toBe('Her 2 günde 3 kez');
  });

  it('ingilizce metni interval ve doz sayisina gore uretir', () => {
    expect(getFrequencySummary(1, 1, 'en')).toBe('Every 1 day, 1 time');
    expect(getFrequencySummary(3, 2, 'en')).toBe('Every 3 days, 2 times');
  });

  it('gecersiz degerlerde guvenli fallback dondurur', () => {
    expect(getFrequencySummary(0, 2, 'tr')).toBe('Sıklık seçin');
    expect(getFrequencySummary(2, 0, 'en')).toBe('Select a valid frequency');
  });
});

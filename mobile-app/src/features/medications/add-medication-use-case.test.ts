import { describe, expect, it } from 'vitest';
import { buildTimeValue, getFrequencySummary, getWeekdayLabel, resolveFrequencyPreset, splitTime } from './add-medication-use-case';

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

  it('hafta gunu etiketlerini dogru gun indexi ile esler', () => {
    expect(getWeekdayLabel(1, 'en')).toMatch(/Mon/i);
    expect(getWeekdayLabel(2, 'en')).toMatch(/Tue/i);
    expect(getWeekdayLabel(0, 'en')).toMatch(/Sun/i);
  });

  it('hazir siklik secimi kurallarini cozer', () => {
    expect(resolveFrequencyPreset('day', 1, 1)).toBe('once-daily');
    expect(resolveFrequencyPreset('day', 1, 2)).toBe('twice-daily');
    expect(resolveFrequencyPreset('as-needed', 1, 1)).toBe('custom');
    expect(resolveFrequencyPreset('day', 2, 1)).toBe('custom');
    expect(resolveFrequencyPreset('week', 1, 1)).toBe('custom');
  });

  it('saat degerlerini 24 saat formatinda guvenle normalize eder', () => {
    expect(splitTime('23:00')).toEqual({ hour: '23', minute: '00' });
    expect(buildTimeValue('23', '00')).toBe('23:00');
    expect(buildTimeValue('24', '75')).toBe('23:59');
  });
});

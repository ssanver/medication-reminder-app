import { describe, expect, it } from 'vitest';
import { getDateTitle, getStartOfWeek, getWeekStrip } from './week-strip';

describe('week-strip', () => {
  it('hafta baslangicini pazartesiye ceker', () => {
    const start = getStartOfWeek(new Date('2026-02-15T10:00:00.000Z'));
    expect(start.getDay()).toBe(1);
  });

  it('7 gunluk strip uretir ve secili gunu isaretler', () => {
    const selected = new Date('2026-02-15T10:00:00.000Z');
    const strip = getWeekStrip(selected, 'en');

    expect(strip).toHaveLength(7);
    expect(strip.some((day) => day.isSelected)).toBe(true);
  });

  it('baslikta locale tabanli metin doner', () => {
    const selected = new Date('2026-02-15T10:00:00.000Z');
    expect(getDateTitle(selected, 'tr')).toContain('Bugun');
    expect(getDateTitle(selected, 'en')).toContain('Today');
  });
});

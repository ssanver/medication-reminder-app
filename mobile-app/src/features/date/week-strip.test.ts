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
    const today = new Date();
    expect(getDateTitle(today, 'tr')).toContain('Bugün');
    expect(getDateTitle(today, 'en')).toContain('Today');
  });

  it('bugun disindaki tarihlerde sadece tarih doner', () => {
    const notToday = new Date();
    notToday.setDate(notToday.getDate() + 2);
    expect(getDateTitle(notToday, 'en')).not.toContain('Today');
  });
});

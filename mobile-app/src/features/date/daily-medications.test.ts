import { describe, expect, it } from 'vitest';
import { getDoseCounts, getDosesForDate, getMedicationSectionTitle } from './daily-medications';

describe('daily-medications', () => {
  it('secilen tarihe gore doz listesi olusturur', () => {
    const doses = getDosesForDate(new Date('2026-02-18T10:00:00.000Z'));
    expect(doses.length).toBeGreaterThan(0);
  });

  it('farkli tarihlerde farkli planlar getirebilir', () => {
    const first = getDosesForDate(new Date('2026-02-18T10:00:00.000Z')).map((item) => item.id);
    const second = getDosesForDate(new Date('2026-02-19T10:00:00.000Z')).map((item) => item.id);
    expect(first.join('|')).not.toBe(second.join('|'));
  });

  it('sayaclari dogru hesaplar', () => {
    const counts = getDoseCounts([
      { id: '1', name: 'A', details: 'x', schedule: '09:00', status: 'taken', emoji: '💊' },
      { id: '2', name: 'B', details: 'x', schedule: '10:00', status: 'missed', emoji: '💊' },
      { id: '3', name: 'C', details: 'x', schedule: '11:00', status: 'pending', emoji: '💊' },
    ]);
    expect(counts).toEqual({ all: 3, taken: 1, missed: 1 });
  });

  it('baslikta secili tarih vurgulanir', () => {
    const tr = getMedicationSectionTitle(new Date('2026-02-15T10:00:00.000Z'), 'tr');
    const en = getMedicationSectionTitle(new Date('2026-02-15T10:00:00.000Z'), 'en');
    expect(tr).toContain('Ilac');
    expect(en).toContain('Medication');
  });
});


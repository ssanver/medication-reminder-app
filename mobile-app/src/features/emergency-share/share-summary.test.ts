import { describe, expect, it } from 'vitest';
import { buildShareSummary } from './share-summary';

describe('share-summary', () => {
  it('yalnizca izinli alanlari donmeli', () => {
    const summary = buildShareSummary(
      {
        name: 'Parol',
        dosage: '500mg',
        frequency: 'daily',
        note: 'after meal',
      },
      ['name', 'dosage'],
    );

    expect(summary.name).toBe('Parol');
    expect(summary.dosage).toBe('500mg');
    expect(summary.frequency).toBeUndefined();
    expect(summary.note).toBeUndefined();
  });
});

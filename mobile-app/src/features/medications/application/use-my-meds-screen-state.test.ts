import { describe, expect, it } from 'vitest';
import { mergeMedicationActiveOverrides, pruneResolvedActiveOverrides } from './my-meds-active-overrides';

describe('useMyMedsScreenState helpers', () => {
  it('applies optimistic active overrides to visible items', () => {
    const items = [
      {
        id: 'med-1',
        name: 'Aspirin',
        details: 'Daily',
        schedule: 'Started',
        active: true,
        emoji: '💊',
      },
      {
        id: 'med-2',
        name: 'Vitamin D',
        details: 'Weekly',
        schedule: 'Started',
        active: false,
        emoji: '🟡',
      },
    ];

    const result = mergeMedicationActiveOverrides(items, {
      'med-1': false,
      'med-2': true,
    });

    expect(result).toEqual([
      { ...items[0], active: false },
      { ...items[1], active: true },
    ]);
  });

  it('clears optimistic overrides once store catches up', () => {
    const overrides = {
      'med-1': false,
      'med-2': true,
      'med-3': false,
    };

    const result = pruneResolvedActiveOverrides(overrides, [
      { id: 'med-1', active: false },
      { id: 'med-2', active: false },
    ]);

    expect(result).toEqual({
      'med-2': true,
    });
  });
});

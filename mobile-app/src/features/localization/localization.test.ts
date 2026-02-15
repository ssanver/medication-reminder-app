import { describe, expect, it } from 'vitest';
import { getTranslations } from './localization';

describe('localization', () => {
  it('dil degisince tab etiketleri degismeli', () => {
    const tr = getTranslations('tr');
    const en = getTranslations('en');

    expect(tr.today).toBe('Bugun');
    expect(en.today).toBe('Today');
    expect(tr.settings).not.toBe(en.settings);
  });
});

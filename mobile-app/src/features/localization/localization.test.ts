import { describe, expect, it } from 'vitest';
import { getTranslations, getLocaleOptions } from './localization';

describe('localization', () => {
  it('dil degisince tab etiketleri degismeli', () => {
    const tr = getTranslations('tr');
    const en = getTranslations('en');

    expect(tr.today).toBe('Bugün');
    expect(en.today).toBe('Today');
    expect(tr.settings).not.toBe(en.settings);
  });

  it('10 dil secenegi donmeli', () => {
    const options = getLocaleOptions('tr');
    expect(options).toHaveLength(10);
    expect(options.some((item) => item.code === 'de')).toBe(true);
  });
});

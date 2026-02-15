import { getTranslations, type Locale } from './localization';

export function localizeFrequencyLabel(label: string, locale: Locale): string {
  const map = getTranslations(locale).frequencyLabels as Record<string, string>;
  return map[label] ?? label;
}

export function localizeFormLabel(form: string, locale: Locale): string {
  const map = getTranslations(locale).formLabels as Record<string, string>;
  return map[form] ?? form;
}

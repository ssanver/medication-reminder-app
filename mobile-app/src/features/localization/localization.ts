import { translations } from '../../localization/translations';

export type Locale = 'tr' | 'en';

export type AppTranslations = (typeof translations)[Locale];

export function getTranslations(locale: Locale): AppTranslations {
  return translations[locale];
}

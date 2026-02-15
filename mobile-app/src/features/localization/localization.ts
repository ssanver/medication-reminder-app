import ar from '../../localization/locales/ar.json';
import de from '../../localization/locales/de.json';
import en from '../../localization/locales/en.json';
import es from '../../localization/locales/es.json';
import fr from '../../localization/locales/fr.json';
import it from '../../localization/locales/it.json';
import pt from '../../localization/locales/pt.json';
import ru from '../../localization/locales/ru.json';
import tr from '../../localization/locales/tr.json';
import zh from '../../localization/locales/zh.json';

export const supportedLocales = ['tr', 'en', 'de', 'fr', 'es', 'it', 'pt', 'ar', 'ru', 'zh'] as const;

export type Locale = (typeof supportedLocales)[number];
export type AppTranslations = typeof en;

const translationsByLocale: Record<Locale, AppTranslations> = {
  tr,
  en,
  de,
  fr,
  es,
  it,
  pt,
  ar,
  ru,
  zh,
};

export function isSupportedLocale(value: string): value is Locale {
  return supportedLocales.includes(value as Locale);
}

export function getLocaleTag(locale: Locale): string {
  const map: Record<Locale, string> = {
    tr: 'tr-TR',
    en: 'en-US',
    de: 'de-DE',
    fr: 'fr-FR',
    es: 'es-ES',
    it: 'it-IT',
    pt: 'pt-PT',
    ar: 'ar-SA',
    ru: 'ru-RU',
    zh: 'zh-CN',
  };

  return map[locale];
}

export function getTranslations(locale: Locale): AppTranslations {
  return translationsByLocale[locale] ?? translationsByLocale.en;
}

export function getLocaleOptions(currentLocale: Locale): Array<{ code: Locale; label: string }> {
  const labels = getTranslations(currentLocale).localeDisplayNames;
  return supportedLocales.map((code) => ({ code, label: labels[code] ?? code }));
}

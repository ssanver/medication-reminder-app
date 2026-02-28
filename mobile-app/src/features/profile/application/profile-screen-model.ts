import { getTranslations, type Locale } from '../../localization/localization';

export function formatProfileDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseProfileDate(value: string): Date {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function getProfileGenderOptions(locale: Locale): string[] {
  const t = getTranslations(locale);
  return [t.genderFemale, t.genderMale, t.genderPreferNotToSay];
}

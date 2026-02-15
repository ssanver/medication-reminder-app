import { type Locale } from './localization';

export function localizeFrequencyLabel(label: string, locale: Locale): string {
  if (locale === 'en') {
    return label;
  }

  if (label === 'Every 1 Day') {
    return 'Her 1 Gun';
  }

  if (label === 'Every 3 Days') {
    return 'Her 3 Gun';
  }

  if (label === 'Every 1 Hour') {
    return 'Her 1 Saat';
  }

  return label;
}

export function localizeFormLabel(form: string, locale: Locale): string {
  if (locale === 'en') {
    return form;
  }

  if (form === 'Capsule') {
    return 'Kapsul';
  }

  if (form === 'Pill') {
    return 'Hap';
  }

  if (form === 'Drop') {
    return 'Damla';
  }

  if (form === 'Syrup') {
    return 'Surup';
  }

  if (form === 'Injection') {
    return 'Enjeksiyon';
  }

  if (form === 'Other') {
    return 'Diger';
  }

  return form;
}


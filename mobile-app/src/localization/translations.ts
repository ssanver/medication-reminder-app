export type Locale = 'tr' | 'en';

export const translations = {
  tr: {
    today: 'Bugun',
    myMeds: 'Ilaclarim',
    addMeds: 'Ilac Ekle',
    settings: 'Ayarlar',
  },
  en: {
    today: 'Today',
    myMeds: 'My Meds',
    addMeds: 'Add Meds',
    settings: 'Settings',
  },
} as const;

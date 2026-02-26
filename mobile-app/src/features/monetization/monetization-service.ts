import { Linking } from 'react-native';

export type SponsoredAd = {
  id: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
};

const defaultDonationUrl = 'https://buymeacoffee.com/pillmind';

export function getDonationUrl(): string {
  return process.env.EXPO_PUBLIC_DONATION_URL ?? defaultDonationUrl;
}

export async function openDonationPage(): Promise<boolean> {
  const url = getDonationUrl();
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      return false;
    }

    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

export function getSponsoredAd(locale: 'tr' | 'en'): SponsoredAd {
  if (locale === 'tr') {
    return {
      id: 'sponsor-001',
      title: 'Sponsorlu',
      body: 'Günlük sağlık takibi için akıllı ilaç kutusu kampanyası.',
      ctaLabel: 'Detay',
      ctaUrl: 'https://example.com/ad/pill-box',
    };
  }

  return {
    id: 'sponsor-001',
    title: 'Sponsored',
    body: 'Smart pillbox promotion for daily health tracking.',
    ctaLabel: 'Learn more',
    ctaUrl: 'https://example.com/ad/pill-box',
  };
}

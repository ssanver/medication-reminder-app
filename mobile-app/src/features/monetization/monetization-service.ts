import { Linking } from 'react-native';
import { getTranslations, type Locale } from '../localization/localization';

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

export function getSponsoredAd(locale: Locale): SponsoredAd {
  const t = getTranslations(locale);
  return {
    id: 'sponsor-001',
    title: t.sponsoredTitle,
    body: t.sponsoredBody,
    ctaLabel: t.sponsoredCta,
    ctaUrl: 'https://example.com/ad/pill-box',
  };
}

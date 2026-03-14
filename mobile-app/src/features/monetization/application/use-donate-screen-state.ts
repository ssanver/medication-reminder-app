import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { loadAppDefinitions } from '../../definitions/definitions-service';
import { getTranslations, type Locale } from '../../localization/localization';
import { getDonationUrl, getSupportEmail } from '../monetization-service';
import type { DonationCampaignContent } from '../domain/monetization-types';

type UseDonateScreenStateArgs = {
  locale: Locale;
};

export function useDonateScreenState({ locale }: UseDonateScreenStateArgs) {
  const t = getTranslations(locale);
  const [campaign, setCampaign] = useState<DonationCampaignContent | null>(null);
  const [errorText, setErrorText] = useState('');
  const [isOpening, setIsOpening] = useState(false);
  const supportEmail = getSupportEmail();

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const definitions = await loadAppDefinitions();
        const donationCampaign = definitions.donationCampaign;
        if (donationCampaign) {
          const localized = donationCampaign.localized[locale] ?? donationCampaign.localized.en ?? Object.values(donationCampaign.localized)[0];
          if (!localized?.title || !localized.body || !localized.ctaLabel || !donationCampaign.ctaUrl) {
            throw new Error(t.error);
          }

          if (!active) {
            return;
          }

          setCampaign({
            title: localized.title,
            body: localized.body,
            ctaLabel: localized.ctaLabel,
            ctaUrl: donationCampaign.ctaUrl,
          });
          setErrorText('');
          return;
        }

        if (!active) {
          return;
        }

        setCampaign({
          title: t.donateHeroTitle,
          body: t.donateHeroBody,
          ctaLabel: t.donatePrimaryCta,
          ctaUrl: getDonationUrl(),
        });
        setErrorText('');
      } catch (error) {
        if (!active) {
          return;
        }
        setCampaign(null);
        setErrorText(error instanceof Error && error.message ? error.message : t.error);
      }
    })();

    return () => {
      active = false;
    };
  }, [locale, t.donateHeroBody, t.donateHeroTitle, t.donatePrimaryCta, t.error]);

  async function openDonation(): Promise<boolean> {
    if (!campaign?.ctaUrl) {
      setErrorText(t.donationUnavailable);
      return false;
    }

    try {
      setIsOpening(true);
      setErrorText('');

      const normalizedUrl = campaign.ctaUrl.trim();
      if (!/^https?:\/\//i.test(normalizedUrl)) {
        throw new Error(t.openDonationFailed);
      }

      const result = await WebBrowser.openBrowserAsync(normalizedUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      });

      return result.type !== 'dismiss';
    } catch (error) {
      setErrorText(error instanceof Error && error.message ? error.message : t.openDonationFailed);
      return false;
    } finally {
      setIsOpening(false);
    }
  }

  async function openSupport(): Promise<boolean> {
    const mailtoUrl = `mailto:${supportEmail}?subject=${encodeURIComponent('Pill Mind Support')}`;

    try {
      const supported = await Linking.canOpenURL(mailtoUrl);
      if (!supported) {
        throw new Error(t.openSupportFailed);
      }

      await Linking.openURL(mailtoUrl);
      return true;
    } catch (error) {
      setErrorText(error instanceof Error && error.message ? error.message : t.openSupportFailed);
      return false;
    }
  }

  return {
    campaign,
    errorText,
    isOpening,
    supportEmail,
    openDonation,
    openSupport,
  };
}

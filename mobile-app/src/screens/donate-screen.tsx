import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ui/screen-header';
import { loadAppDefinitions } from '../features/definitions/definitions-service';
import { getTranslations, type Locale } from '../features/localization/localization';
import { theme } from '../theme';
import * as Linking from 'expo-linking';

type DonateScreenProps = {
  locale: Locale;
  onBack: () => void;
};

export function DonateScreen({ locale, onBack }: DonateScreenProps) {
  const t = getTranslations(locale);
  const [campaign, setCampaign] = useState<{ title: string; body: string; ctaLabel: string; ctaUrl: string } | null>(null);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const definitions = await loadAppDefinitions();
        const donationCampaign = definitions.donationCampaign;
        if (!donationCampaign) {
          throw new Error(t.error);
        }

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
  }, [locale, t.error]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title={t.donate} leftAction={{ icon: 'back', onPress: onBack }} />

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>{campaign?.title ?? t.donate}</Text>
        <Text style={styles.heroBody}>{campaign?.body ?? t.loading}</Text>
      </View>

      <View style={styles.planWrap}>
        {campaign ? (
          <Pressable
            style={styles.donateCard}
            onPress={() => {
              void Linking.openURL(campaign.ctaUrl);
            }}
          >
            <Text style={styles.cardTitle}>{campaign.ctaLabel}</Text>
            <Text style={styles.cardBody}>{campaign.body}</Text>
          </Pressable>
        ) : null}
        {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.semantic.screenBackground,
  },
  content: {
    gap: theme.spacing[16],
    paddingBottom: theme.spacing[24],
  },
  heroCard: {
    borderRadius: theme.radius[16],
    padding: theme.spacing[16],
    backgroundColor: '#1E1E22',
    gap: theme.spacing[8],
  },
  heroTitle: {
    ...theme.typography.heading.h5Semibold,
    color: '#FFFFFF',
  },
  heroBody: {
    ...theme.typography.bodyScale.mRegular,
    color: '#E6E6E6',
  },
  planWrap: {
    gap: theme.spacing[10],
  },
  donateCard: {
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.semantic.cardBackground,
    padding: theme.spacing[14],
    gap: theme.spacing[6],
  },
  cardTitle: {
    ...theme.typography.bodyScale.mBold,
    color: theme.colors.semantic.textPrimary,
  },
  cardBody: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  errorText: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.error[500],
    textAlign: 'center',
  },
});

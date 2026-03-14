import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ui/screen-header';
import { getTranslations, type Locale } from '../features/localization/localization';
import { useDonateScreenState } from '../features/monetization/application/use-donate-screen-state';
import { theme } from '../theme';

type DonateScreenProps = {
  locale: Locale;
  onBack: () => void;
};

export function DonateScreen({ locale, onBack }: DonateScreenProps) {
  const t = getTranslations(locale);
  const { campaign, errorText, isOpening, supportEmail, openDonation, openSupport } = useDonateScreenState({ locale });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title={t.donate} leftAction={{ icon: 'back', onPress: onBack }} />

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>{campaign?.title ?? t.donateHeroTitle}</Text>
        <Text style={styles.heroBody}>{campaign?.body ?? t.donateHeroBody}</Text>
        <Text style={styles.heroCaption}>{t.donateExternalNotice}</Text>
      </View>

      <View style={styles.planWrap}>
        {campaign ? (
          <Pressable
            style={styles.donateCard}
            onPress={() => {
              void openDonation();
            }}
          >
            <Text style={styles.cardEyebrow}>{t.donateImpactTitle}</Text>
            <Text style={styles.cardTitle}>{isOpening ? t.loading : campaign.ctaLabel}</Text>
            <Text style={styles.cardBody}>{campaign.body}</Text>
            <View style={styles.impactList}>
              <Text style={styles.impactItem}>• {t.donateImpactItemOne}</Text>
              <Text style={styles.impactItem}>• {t.donateImpactItemTwo}</Text>
              <Text style={styles.impactItem}>• {t.donateImpactItemThree}</Text>
            </View>
          </Pressable>
        ) : null}

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>{t.donateHowItWorksTitle}</Text>
          <Text style={styles.cardBody}>{t.donateHowItWorksBody}</Text>
        </View>

        <Pressable style={styles.infoCard} onPress={() => void openSupport()}>
          <Text style={styles.cardTitle}>{t.donateSupportTitle}</Text>
          <Text style={styles.cardBody}>{t.donateSupportBody}</Text>
          <Text style={styles.supportEmail}>{supportEmail}</Text>
        </Pressable>

        {campaign?.ctaUrl ? (
          <View style={styles.linkCard}>
            <Text style={styles.linkLabel}>{t.donateLinkLabel}</Text>
            <Text selectable style={styles.linkValue}>
              {campaign.ctaUrl}
            </Text>
          </View>
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
  heroCaption: {
    ...theme.typography.captionScale.lRegular,
    color: '#C7CBD4',
  },
  planWrap: {
    gap: theme.spacing[8],
  },
  donateCard: {
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.semantic.cardBackground,
    padding: theme.spacing[16],
    gap: theme.spacing[8],
  },
  infoCard: {
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.semantic.cardMutedBackground,
    padding: theme.spacing[16],
    gap: theme.spacing[8],
  },
  linkCard: {
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.primaryBlue[100],
    backgroundColor: theme.colors.primaryBlue[50],
    padding: theme.spacing[16],
    gap: theme.spacing[8],
  },
  cardEyebrow: {
    ...theme.typography.captionScale.mRegular,
    color: theme.colors.primaryBlue[700],
  },
  cardTitle: {
    ...theme.typography.bodyScale.mBold,
    color: theme.colors.semantic.textPrimary,
  },
  cardBody: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  impactList: {
    gap: theme.spacing[4],
  },
  impactItem: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textPrimary,
  },
  supportEmail: {
    ...theme.typography.bodyScale.mMedium,
    color: theme.colors.primaryBlue[700],
  },
  linkLabel: {
    ...theme.typography.captionScale.mRegular,
    color: theme.colors.primaryBlue[700],
  },
  linkValue: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textPrimary,
  },
  errorText: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.error[500],
    textAlign: 'center',
  },
});

import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ui/screen-header';
import { loadAppDefinitions } from '../features/definitions/definitions-service';
import { getTranslations, type Locale } from '../features/localization/localization';
import {
  activateSubscriptionPlan,
  getMonetizationStatus,
  refreshMonetizationStatus,
  type MonetizationStatus,
  type SubscriptionOffer,
  subscribeMonetizationStatus,
} from '../features/monetization/subscription-service';
import {
  isRevenueCatConfigured,
  loadRevenueCatOffers,
  purchaseRevenueCatPackage,
  restoreRevenueCatPurchases,
  type StoreSubscriptionOffer,
} from '../features/monetization/revenuecat-service';
import { theme } from '../theme';

type PremiumScreenProps = {
  locale: Locale;
  isGuestMode: boolean;
  onBack: () => void;
  onOpenSignUp: () => void;
};

export function PremiumScreen({ locale, isGuestMode, onBack, onOpenSignUp }: PremiumScreenProps) {
  const t = getTranslations(locale);
  const [offers, setOffers] = useState<Array<SubscriptionOffer | StoreSubscriptionOffer>>([]);
  const [status, setStatus] = useState<MonetizationStatus>({
    role: 'visitor',
    adsEnabled: true,
    activePlanId: null,
    updatedAt: null,
  });
  const [errorText, setErrorText] = useState('');
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [purchaseMode, setPurchaseMode] = useState<'store' | 'direct' | 'disabled'>('disabled');
  const [restoreLoading, setRestoreLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeMonetizationStatus((next) => setStatus(next));
    void (async () => {
      try {
        if (isRevenueCatConfigured()) {
          const storeOffers = await loadRevenueCatOffers(locale);
          if (storeOffers.length === 0) {
            throw new Error(t.purchasesUnavailable);
          }
          setOffers(storeOffers);
          setPurchaseMode('store');
        } else {
          const definitions = await loadAppDefinitions();
          if (!definitions.subscriptionOffers || definitions.subscriptionOffers.length === 0) {
            throw new Error(t.purchasesUnavailable);
          }
          setOffers(definitions.subscriptionOffers);
          setPurchaseMode(process.env.EXPO_PUBLIC_ALLOW_DIRECT_SUBSCRIPTION_ACTIVATION === 'true' ? 'direct' : 'disabled');
        }
        setErrorText('');
      } catch (error) {
        setOffers([]);
        setPurchaseMode('disabled');
        setErrorText(error instanceof Error && error.message ? error.message : t.error);
      }

      const persisted = await getMonetizationStatus();
      setStatus(persisted);
      await refreshMonetizationStatus();
    })();

    return unsubscribe;
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title={t.removeAds} leftAction={{ icon: 'back', onPress: onBack }} />

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>{t.removeAds}</Text>
        <Text style={styles.heroBody}>{t.removeAdsDescription}</Text>
        <Text style={styles.heroCaption}>{purchaseMode === 'store' ? t.secureStorePurchase : t.purchasesUnavailable}</Text>
        <View style={styles.badgesRow}>
          <View style={[styles.badge, status.adsEnabled ? styles.badgeNeutral : styles.badgeSuccess]}>
            <Text style={styles.badgeText}>{status.adsEnabled ? t.sponsoredTitle : t.adFreeActive}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{status.role.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {isGuestMode ? (
        <View style={styles.guestCard}>
          <Text style={styles.guestTitle}>{t.signUpNow}</Text>
          <Text style={styles.guestBody}>{t.guestProfileWarning}</Text>
          <Pressable style={styles.signUpButton} onPress={onOpenSignUp}>
            <Text style={styles.signUpButtonText}>{t.signUpNow}</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.plansWrap}>
        {offers.map((offer) => {
          const localized =
            'localized' in offer ? offer.localized[locale] ?? offer.localized.en ?? Object.values(offer.localized)[0] : offer;
          const isSelected = status.activePlanId === offer.id;
          const isLoading = loadingPlanId === offer.id;
          return (
            <Pressable
              key={offer.id}
              style={[styles.planCard, isSelected && styles.planCardActive]}
              disabled={isGuestMode || isLoading || purchaseMode === 'disabled'}
              onPress={() => {
                void (async () => {
                  try {
                    setErrorText('');
                    setLoadingPlanId(offer.id);
                    if (purchaseMode === 'store') {
                      await purchaseRevenueCatPackage(offer.id);
                    } else if (purchaseMode === 'direct') {
                      await activateSubscriptionPlan(offer.id);
                    } else {
                      throw new Error(t.purchasesUnavailable);
                    }
                  } catch (error) {
                    setErrorText(error instanceof Error ? error.message : t.error);
                  } finally {
                    setLoadingPlanId(null);
                  }
                })();
              }}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planTitle}>{localized?.title ?? offer.id}</Text>
                {isSelected ? <Text style={styles.planTag}>{t.active}</Text> : null}
              </View>
              <Text style={styles.planPrice}>{localized?.priceLabel ?? ''}</Text>
              {localized?.badge ? <Text style={styles.planBadge}>{localized.badge}</Text> : null}
              <Text style={styles.planHint}>{localized?.description ?? t.removeAdsDescription}</Text>
              <View style={styles.planCtaRow}>
                <Text style={styles.planCta}>{localized?.ctaLabel ?? t.removeAds}</Text>
              </View>
              {isLoading ? <Text style={styles.planLoading}>{t.loading}</Text> : null}
            </Pressable>
          );
        })}
      </View>

      {purchaseMode === 'store' ? (
        <Pressable
          style={[styles.restoreButton, restoreLoading && styles.restoreButtonDisabled]}
          disabled={restoreLoading}
          onPress={() => {
            void (async () => {
              try {
                setRestoreLoading(true);
                setErrorText('');
                await restoreRevenueCatPurchases();
              } catch (error) {
                setErrorText(error instanceof Error ? error.message : t.error);
              } finally {
                setRestoreLoading(false);
              }
            })();
          }}
        >
          <Text style={styles.restoreButtonText}>{restoreLoading ? t.loading : t.restorePurchases}</Text>
        </Pressable>
      ) : null}

      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
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
  badgesRow: {
    flexDirection: 'row',
    gap: theme.spacing[8],
  },
  badge: {
    borderRadius: theme.radius[8],
    backgroundColor: '#2F2F36',
    paddingHorizontal: theme.spacing[8],
    paddingVertical: theme.spacing[4],
  },
  badgeNeutral: {
    backgroundColor: '#2F2F36',
  },
  badgeSuccess: {
    backgroundColor: '#0F4D2F',
  },
  badgeText: {
    ...theme.typography.captionScale.mRegular,
    color: '#FFFFFF',
  },
  guestCard: {
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.error[200],
    backgroundColor: theme.colors.error[50],
    padding: theme.spacing[16],
    gap: theme.spacing[8],
  },
  guestTitle: {
    ...theme.typography.bodyScale.mBold,
    color: theme.colors.error[800],
  },
  guestBody: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.error[800],
  },
  signUpButton: {
    minHeight: 36,
    borderRadius: theme.radius[16],
    backgroundColor: theme.colors.error[500],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[16],
    alignSelf: 'flex-start',
  },
  signUpButtonText: {
    ...theme.typography.bodyScale.mMedium,
    color: '#FFFFFF',
  },
  plansWrap: {
    gap: theme.spacing[8],
  },
  planCard: {
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.semantic.cardBackground,
    padding: theme.spacing[16],
    gap: theme.spacing[8],
  },
  planCardActive: {
    borderColor: theme.colors.primaryBlue[400],
    backgroundColor: theme.colors.primaryBlue[50],
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing[8],
  },
  planTitle: {
    ...theme.typography.bodyScale.mBold,
    color: theme.colors.semantic.textPrimary,
  },
  planTag: {
    ...theme.typography.captionScale.mRegular,
    color: theme.colors.primaryBlue[700],
  },
  planPrice: {
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.semantic.textSecondary,
  },
  planHint: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  planBadge: {
    ...theme.typography.captionScale.mRegular,
    color: theme.colors.warning[800],
  },
  planCtaRow: {
    marginTop: theme.spacing[4],
  },
  planCta: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.primaryBlue[700],
  },
  planLoading: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.primaryBlue[700],
  },
  restoreButton: {
    minHeight: 44,
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.semantic.cardBackground,
    paddingHorizontal: theme.spacing[16],
  },
  restoreButtonDisabled: {
    opacity: 0.6,
  },
  restoreButtonText: {
    ...theme.typography.bodyScale.mMedium,
    color: theme.colors.semantic.textPrimary,
  },
  errorText: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.error[500],
    textAlign: 'center',
  },
});

import { useEffect, useState } from 'react';
import { getTranslations, type Locale } from '../../localization/localization';
import { loadAppDefinitions } from '../../definitions/definitions-service';
import {
  activateSubscriptionPlan,
  getMonetizationStatus,
  refreshMonetizationStatus,
  subscribeMonetizationStatus,
} from '../subscription-service';
import {
  isRevenueCatConfigured,
  loadRevenueCatOffers,
  purchaseRevenueCatPackage,
  restoreRevenueCatPurchases,
} from '../revenuecat-service';
import type { MonetizationStatus, StoreSubscriptionOffer, SubscriptionOffer } from '../domain/monetization-types';

type UsePremiumScreenStateArgs = {
  locale: Locale;
  isGuestMode: boolean;
};

export function usePremiumScreenState({ locale, isGuestMode }: UsePremiumScreenStateArgs) {
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
  }, [locale, t.error, t.purchasesUnavailable]);

  async function selectOffer(offerId: string): Promise<'guest' | 'unavailable' | 'activated' | 'error'> {
    if (isGuestMode) {
      setErrorText(t.guestPremiumSignupRequired);
      return 'guest';
    }

    if (purchaseMode === 'disabled') {
      setErrorText(t.purchasesUnavailable);
      return 'unavailable';
    }

    try {
      setErrorText('');
      setLoadingPlanId(offerId);
      if (purchaseMode === 'store') {
        await purchaseRevenueCatPackage(offerId);
      } else {
        await activateSubscriptionPlan(offerId);
      }
      return 'activated';
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : t.error);
      return 'error';
    } finally {
      setLoadingPlanId(null);
    }
  }

  async function restorePurchases(): Promise<boolean> {
    try {
      setRestoreLoading(true);
      setErrorText('');
      await restoreRevenueCatPurchases();
      return true;
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : t.error);
      return false;
    } finally {
      setRestoreLoading(false);
    }
  }

  return {
    offers,
    status,
    errorText,
    loadingPlanId,
    purchaseMode,
    restoreLoading,
    setErrorText,
    selectOffer,
    restorePurchases,
  };
}

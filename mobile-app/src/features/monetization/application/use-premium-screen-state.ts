import { useEffect, useState } from 'react';
import { getTranslations, type Locale } from '../../localization/localization';
import {
  getMonetizationStatus,
  subscribeMonetizationStatus,
} from '../subscription-service';
import {
  initializeStorePurchases,
  isStorePurchaseConfigured,
  loadStoreOffers,
  purchaseStoreOffer,
  refreshStorePurchaseStatus,
  restoreStorePurchases,
} from '../store-purchase-service';
import type { MonetizationStatus, StoreSubscriptionOffer } from '../domain/monetization-types';

type UsePremiumScreenStateArgs = {
  locale: Locale;
  isGuestMode: boolean;
};

export function usePremiumScreenState({ locale, isGuestMode }: UsePremiumScreenStateArgs) {
  const t = getTranslations(locale);
  const [offers, setOffers] = useState<StoreSubscriptionOffer[]>([]);
  const [status, setStatus] = useState<MonetizationStatus>({
    role: 'visitor',
    adsEnabled: true,
    activePlanId: null,
    updatedAt: null,
  });
  const [errorText, setErrorText] = useState('');
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [purchaseMode, setPurchaseMode] = useState<'store' | 'disabled'>('disabled');
  const [restoreLoading, setRestoreLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeMonetizationStatus((next) => setStatus(next));
    void (async () => {
      try {
        if (isStorePurchaseConfigured()) {
          await initializeStorePurchases(locale);
          await refreshStorePurchaseStatus().catch(() => false);
          const storeOffers = await loadStoreOffers(locale);
          if (storeOffers.length === 0) {
            throw new Error(t.purchasesUnavailable);
          }
          setOffers(storeOffers);
          setPurchaseMode('store');
        } else {
          throw new Error(t.purchasesUnavailable);
        }
        setErrorText('');
      } catch (error) {
        setOffers([]);
        setPurchaseMode('disabled');
        setErrorText(error instanceof Error && error.message ? error.message : t.error);
      }

      const persisted = await getMonetizationStatus();
      setStatus(persisted);
    })();

    return unsubscribe;
  }, [locale, t.error, t.purchasesUnavailable]);

  async function selectOffer(offerId: string): Promise<'guest' | 'unavailable' | 'cancelled' | 'activated' | 'error'> {
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
      const result = await purchaseStoreOffer(offerId);
      if (result === 'cancelled') {
        return 'cancelled';
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
      await restoreStorePurchases();
      await refreshStorePurchaseStatus().catch(() => false);
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

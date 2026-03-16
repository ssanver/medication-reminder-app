import { Platform } from 'react-native';
import {
  endConnection,
  fetchProducts,
  finishTransaction,
  getActiveSubscriptions,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases,
  type ProductSubscription,
  type Purchase,
  type PurchaseError,
} from 'react-native-iap';
import { getTranslations, type Locale } from '../localization/localization';
import { syncStoreSubscriptionStatus } from './subscription-service';
import type { StoreSubscriptionOffer } from './domain/monetization-types';

type PurchaseResult = 'purchased' | 'cancelled';

type PendingPurchase = {
  resolve: (result: PurchaseResult) => void;
  reject: (error: Error) => void;
};

const storeProductsById = new Map<string, ProductSubscription>();
const androidOfferTokensByProductId = new Map<string, string>();

let isInitialized = false;
let purchaseListenersAttached = false;
let pendingPurchase: PendingPurchase | null = null;
let activeLocale: Locale = 'en';
let purchaseUpdatedSubscription: { remove: () => void } | null = null;
let purchaseErrorSubscription: { remove: () => void } | null = null;

function getConfiguredProductIds(): string[] {
  const monthly = process.env.EXPO_PUBLIC_PREMIUM_MONTHLY_PRODUCT_ID?.trim();
  const yearly = process.env.EXPO_PUBLIC_PREMIUM_YEARLY_PRODUCT_ID?.trim();

  return [monthly, yearly].filter((value): value is string => Boolean(value));
}

function inferOfferBadge(product: ProductSubscription, locale: Locale): string | undefined {
  const normalizedId = product.id.toLowerCase();
  if (normalizedId.includes('year')) {
    return locale === 'tr' ? 'Yillik' : 'Annual';
  }

  if (normalizedId.includes('month')) {
    return locale === 'tr' ? 'Aylik' : 'Monthly';
  }

  if (product.platform === 'ios' && product.subscriptionPeriodUnitIOS === 'year') {
    return locale === 'tr' ? 'Yillik' : 'Annual';
  }

  if (product.platform === 'ios' && product.subscriptionPeriodUnitIOS === 'month') {
    return locale === 'tr' ? 'Aylik' : 'Monthly';
  }

  return undefined;
}

function rememberProducts(products: ProductSubscription[]): void {
  storeProductsById.clear();
  androidOfferTokensByProductId.clear();

  products.forEach((product) => {
    storeProductsById.set(product.id, product);
    const firstOfferToken =
      product.subscriptionOffers?.find((offer) => typeof offer.offerTokenAndroid === 'string' && offer.offerTokenAndroid.trim().length > 0)?.offerTokenAndroid
      ?? (product.platform === 'android'
        ? product.subscriptionOfferDetailsAndroid.find((offer) => offer.offerToken.trim().length > 0)?.offerToken
        : null);

    if (typeof firstOfferToken === 'string' && firstOfferToken.trim().length > 0) {
      androidOfferTokensByProductId.set(product.id, firstOfferToken.trim());
    }
  });
}

function toPurchaseError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error('Store purchase failed.');
}

function isPurchaseCancelled(error: PurchaseError | Error): boolean {
  const candidate = error as PurchaseError & { userCancelled?: boolean };
  return candidate.code === 'user-cancelled' || candidate.userCancelled === true;
}

async function syncStatusFromStore(purchase?: Purchase): Promise<void> {
  const productIds = getConfiguredProductIds();
  if (productIds.length === 0) {
    return;
  }

  const activeSubscriptions = await getActiveSubscriptions(productIds);
  const activeSubscription = activeSubscriptions.find((subscription) => subscription.isActive);
  await syncStoreSubscriptionStatus({
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    isActive: Boolean(activeSubscription),
    planId: activeSubscription?.productId ?? null,
    storeToken: purchase?.purchaseToken ?? activeSubscription?.purchaseToken ?? null,
    transactionId: purchase?.transactionId ?? activeSubscription?.transactionId ?? null,
  });
}

async function handlePurchaseSuccess(purchase: Purchase): Promise<void> {
  await finishTransaction({ purchase, isConsumable: false });
  await syncStatusFromStore(purchase);
  pendingPurchase?.resolve('purchased');
  pendingPurchase = null;
}

function attachPurchaseListeners(): void {
  if (purchaseListenersAttached) {
    return;
  }

  purchaseUpdatedSubscription = purchaseUpdatedListener((purchase) => {
    void handlePurchaseSuccess(purchase).catch((error) => {
      pendingPurchase?.reject(toPurchaseError(error));
      pendingPurchase = null;
    });
  });

  purchaseErrorSubscription = purchaseErrorListener((error) => {
    if (pendingPurchase) {
      if (isPurchaseCancelled(error)) {
        pendingPurchase.resolve('cancelled');
      } else {
        pendingPurchase.reject(toPurchaseError(error));
      }
      pendingPurchase = null;
    }
  });

  purchaseListenersAttached = true;
}

function buildStoreOffer(product: ProductSubscription, locale: Locale): StoreSubscriptionOffer {
  const t = getTranslations(locale);
  return {
    id: product.id,
    packageId: product.id,
    title: product.title.trim() || product.displayName?.trim() || product.id,
    description: product.description?.trim() || t.removeAdsDescription,
    priceLabel: product.displayPrice,
    badge: inferOfferBadge(product, locale),
    ctaLabel: t.removeAds,
  };
}

export function isStorePurchaseConfigured(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android'
    ? getConfiguredProductIds().length > 0
    : false;
}

export async function initializeStorePurchases(locale: Locale): Promise<boolean> {
  if (!isStorePurchaseConfigured()) {
    return false;
  }

  activeLocale = locale;

  if (!isInitialized) {
    await initConnection();
    attachPurchaseListeners();
    isInitialized = true;
  }

  await syncStatusFromStore();
  return true;
}

export async function refreshStorePurchaseStatus(): Promise<boolean> {
  if (!isInitialized) {
    return initializeStorePurchases(activeLocale);
  }

  await syncStatusFromStore();
  return true;
}

export async function loadStoreOffers(locale: Locale): Promise<StoreSubscriptionOffer[]> {
  const productIds = getConfiguredProductIds();
  if (productIds.length === 0) {
    return [];
  }

  await initializeStorePurchases(locale);
  const products = await fetchProducts({ skus: productIds, type: 'subs' });
  const subscriptions = (products ?? []).filter((product): product is ProductSubscription => product.type === 'subs');
  rememberProducts(subscriptions);

  return subscriptions.map((product) => buildStoreOffer(product, locale));
}

export async function purchaseStoreOffer(offerId: string): Promise<PurchaseResult> {
  const product = storeProductsById.get(offerId);
  if (!product) {
    throw new Error('Selected store product could not be found.');
  }

  if (pendingPurchase) {
    throw new Error('Another purchase is already in progress.');
  }

  const purchasePromise = new Promise<PurchaseResult>((resolve, reject) => {
    pendingPurchase = { resolve, reject };
  });

  try {
    if (Platform.OS === 'ios') {
      await requestPurchase({
        type: 'subs',
        request: {
          apple: {
            sku: product.id,
            andDangerouslyFinishTransactionAutomatically: false,
          },
        },
      });
    } else {
      const offerToken = androidOfferTokensByProductId.get(product.id);
      await requestPurchase({
        type: 'subs',
        request: {
          google: {
            skus: [product.id],
            subscriptionOffers: offerToken ? [{ sku: product.id, offerToken }] : undefined,
          },
        },
      });
    }

    return await purchasePromise;
  } catch (error) {
    pendingPurchase = null;
    throw toPurchaseError(error);
  }
}

export async function restoreStorePurchases(): Promise<void> {
  await initializeStorePurchases(activeLocale);
  await restorePurchases();
  await syncStatusFromStore();
}

export async function disconnectStorePurchases(): Promise<void> {
  purchaseUpdatedSubscription?.remove();
  purchaseErrorSubscription?.remove();
  purchaseUpdatedSubscription = null;
  purchaseErrorSubscription = null;
  purchaseListenersAttached = false;
  pendingPurchase = null;

  if (isInitialized) {
    await endConnection();
    isInitialized = false;
  }
}

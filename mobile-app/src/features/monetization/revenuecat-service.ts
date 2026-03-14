import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, type CustomerInfo, type PurchasesOffering, type PurchasesPackage } from 'react-native-purchases';
import { loadAuthSession } from '../auth/auth-session-store';
import { getTranslations, type Locale } from '../localization/localization';
import { setMonetizationStatus } from './subscription-service';
import type { StoreSubscriptionOffer } from './domain/monetization-types';

const DEFAULT_ENTITLEMENT_ID = 'premium';

let isConfigured = false;
let configuredAppUserId = '';
let listenerAttached = false;
const packagesById = new Map<string, PurchasesPackage>();

function getRevenueCatApiKey(): string | null {
  const raw =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
      : Platform.OS === 'android'
        ? process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY
        : null;

  const normalized = raw?.trim();
  return normalized ? normalized : null;
}

function getEntitlementId(): string {
  const raw = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID?.trim();
  return raw || DEFAULT_ENTITLEMENT_ID;
}

function getPackageBadge(aPackage: PurchasesPackage, locale: Locale): string | undefined {
  if (aPackage.packageType === Purchases.PACKAGE_TYPE.ANNUAL) {
    return locale === 'tr' ? 'Yillik' : 'Annual';
  }

  if (aPackage.packageType === Purchases.PACKAGE_TYPE.MONTHLY) {
    return locale === 'tr' ? 'Aylik' : 'Monthly';
  }

  if (aPackage.product.introPrice) {
    return locale === 'tr' ? 'Deneme / Kampanya' : 'Trial / Intro';
  }

  return undefined;
}

function getPackageDescription(aPackage: PurchasesPackage, locale: Locale): string {
  if (aPackage.product.description?.trim()) {
    return aPackage.product.description.trim();
  }

  return getTranslations(locale).removeAdsDescription;
}

function rememberOffering(offering: PurchasesOffering | null): void {
  packagesById.clear();
  if (!offering) {
    return;
  }

  offering.availablePackages.forEach((aPackage) => {
    packagesById.set(aPackage.identifier, aPackage);
    packagesById.set(aPackage.product.identifier, aPackage);
  });
}

function isPurchaseCancelled(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as { userCancelled?: boolean; code?: string };
  return candidate.userCancelled === true || candidate.code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
}

async function syncStatusFromCustomerInfo(customerInfo: CustomerInfo): Promise<void> {
  const session = await loadAuthSession();
  const entitlement = customerInfo.entitlements.active[getEntitlementId()];
  const hasPremium = entitlement?.isActive === true;
  const role = hasPremium ? 'vip' : session.role === 'visitor' ? 'visitor' : 'member';

  await setMonetizationStatus({
    role,
    adsEnabled: !hasPremium,
    activePlanId: hasPremium ? entitlement.productIdentifier : null,
    updatedAt: new Date().toISOString(),
  });
}

export function isRevenueCatConfigured(): boolean {
  return Boolean(getRevenueCatApiKey()) && (Platform.OS === 'ios' || Platform.OS === 'android');
}

export async function initializeRevenueCatPurchases(appUserId: string, locale: Locale): Promise<boolean> {
  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    return false;
  }

  if (!listenerAttached) {
    Purchases.addCustomerInfoUpdateListener((customerInfo) => {
      void syncStatusFromCustomerInfo(customerInfo);
    });
    listenerAttached = true;
  }

  if (!isConfigured) {
    Purchases.configure({
      apiKey,
      appUserID: appUserId,
      preferredUILocaleOverride: locale,
    });
    isConfigured = true;
    configuredAppUserId = appUserId;
    await Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
  } else if (configuredAppUserId !== appUserId) {
    await Purchases.logIn(appUserId);
    configuredAppUserId = appUserId;
  }

  const customerInfo = await Purchases.getCustomerInfo();
  await syncStatusFromCustomerInfo(customerInfo);
  return true;
}

export async function loadRevenueCatOffers(locale: Locale): Promise<StoreSubscriptionOffer[]> {
  const offerings = await Purchases.getOfferings();
  rememberOffering(offerings.current);

  return (
    offerings.current?.availablePackages.map((aPackage) => ({
      id: aPackage.product.identifier,
      packageId: aPackage.identifier,
      title: aPackage.product.title.trim() || aPackage.product.identifier,
      description: getPackageDescription(aPackage, locale),
      priceLabel: aPackage.product.priceString,
      badge: getPackageBadge(aPackage, locale),
      ctaLabel: getTranslations(locale).removeAds,
    })) ?? []
  );
}

export async function purchaseRevenueCatPackage(offerId: string): Promise<void> {
  const targetPackage = packagesById.get(offerId);
  if (!targetPackage) {
    throw new Error('Selected package could not be found.');
  }

  try {
    const result = await Purchases.purchasePackage(targetPackage);
    await syncStatusFromCustomerInfo(result.customerInfo);
  } catch (error) {
    if (isPurchaseCancelled(error)) {
      return;
    }

    throw error;
  }
}

export async function restoreRevenueCatPurchases(): Promise<void> {
  const customerInfo = await Purchases.restorePurchases();
  await syncStatusFromCustomerInfo(customerInfo);
}

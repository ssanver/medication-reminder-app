import type { UserRole } from '../../auth/auth-session-store';

export type SubscriptionOffer = {
  id: string;
  localized: Record<string, { title: string; priceLabel: string; description?: string; badge?: string; ctaLabel?: string }>;
};

export type StoreSubscriptionOffer = {
  id: string;
  packageId: string;
  title: string;
  description: string;
  priceLabel: string;
  badge?: string;
  ctaLabel: string;
};

export type MonetizationStatus = {
  role: UserRole;
  adsEnabled: boolean;
  activePlanId: string | null;
  updatedAt: string | null;
};

export type AdFreeStatus = {
  isAdFree: boolean;
  planId: string | null;
  activatedAt: string | null;
};

export type DonationCampaignContent = {
  title: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
};

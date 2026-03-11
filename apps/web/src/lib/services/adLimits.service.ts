/**
 * Ad Limits Service for Next.js API Routes
 * Fetches ad-related limits from site_settings and enforces them.
 */

import { prisma } from '@thulobazaar/database';

export interface AdLimits {
  maxAdsPerUser: number;
  adExpiryDays: number;      // 0 = no expiration
  freeAdsLimit: number;
  maxImagesPerAd: number;    // fallback
  maxImagesVerified: number;
  maxImagesUnverified: number;
}

const DEFAULTS: AdLimits = {
  maxAdsPerUser: 50,
  adExpiryDays: 0,
  freeAdsLimit: 30,
  maxImagesPerAd: 10,
  maxImagesVerified: 10,
  maxImagesUnverified: 5,
};

const SETTING_KEYS = [
  'max_ads_per_user',
  'ad_expiry_days',
  'free_ads_limit',
  'max_images_per_ad',
  'max_images_verified_users',
  'max_images_unverified_users',
];

export async function getAdLimits(): Promise<AdLimits> {
  try {
    const settings = await prisma.site_settings.findMany({
      where: { setting_key: { in: SETTING_KEYS } },
      select: { setting_key: true, setting_value: true },
    });

    const map: Record<string, string> = {};
    for (const s of settings) {
      if (s.setting_value) map[s.setting_key] = s.setting_value;
    }

    return {
      maxAdsPerUser: parseInt(map.max_ads_per_user || '', 10) || DEFAULTS.maxAdsPerUser,
      adExpiryDays: parseInt(map.ad_expiry_days || '', 10) ?? DEFAULTS.adExpiryDays,
      freeAdsLimit: parseInt(map.free_ads_limit || '', 10) || DEFAULTS.freeAdsLimit,
      maxImagesPerAd: parseInt(map.max_images_per_ad || '', 10) || DEFAULTS.maxImagesPerAd,
      maxImagesVerified: parseInt(map.max_images_verified_users || '', 10) || DEFAULTS.maxImagesVerified,
      maxImagesUnverified: parseInt(map.max_images_unverified_users || '', 10) || DEFAULTS.maxImagesUnverified,
    };
  } catch (error) {
    console.error('Failed to fetch ad limits:', error);
    return DEFAULTS;
  }
}

export async function isUserVerified(userId: number): Promise<boolean> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      individual_verified: true,
      business_verification_status: true,
    },
  });
  if (!user) return false;
  return user.individual_verified === true ||
    user.business_verification_status === 'approved' ||
    user.business_verification_status === 'verified';
}

export async function getImageLimitForUser(userId: number): Promise<number> {
  const [limits, verified] = await Promise.all([
    getAdLimits(),
    isUserVerified(userId),
  ]);
  return verified ? limits.maxImagesVerified : limits.maxImagesUnverified;
}

export async function countUserActiveAds(userId: number): Promise<number> {
  return prisma.ads.count({
    where: {
      user_id: userId,
      deleted_at: null,
      status: { notIn: ['expired', 'deleted'] },
    },
  });
}

/**
 * Fetch a single boolean setting from site_settings (defaults to true)
 */
export async function getBooleanSetting(key: string, defaultValue = true): Promise<boolean> {
  try {
    const setting = await prisma.site_settings.findUnique({
      where: { setting_key: key },
      select: { setting_value: true },
    });
    if (!setting?.setting_value) return defaultValue;
    return setting.setting_value === 'true';
  } catch {
    return defaultValue;
  }
}

export function calculateExpiresAt(adExpiryDays: number): Date | null {
  if (adExpiryDays <= 0) return null;
  const date = new Date();
  date.setDate(date.getDate() + adExpiryDays);
  return date;
}

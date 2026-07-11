import { prisma } from '@thulobazaar/database';
import type { PaymentType } from '@/lib/paymentGateways/types';

/**
 * 🔒 PAY-4: Server-side authoritative pricing (web twin of
 * apps/api/src/services/payment.service.ts getAuthoritativeAmount — keep in sync).
 *
 * The client's `amount`/`metadata` are NEVER trusted. At initiation we compute the
 * expected price from promotion_pricing / verification_pricing and reject any
 * amount below it. Mirrors the exact client formula (usePromotionPricing):
 *   round(individualBasePrice × (1 − min(accountDiscount + campaignDiscount, 90)/100))
 */

/** Tolerance for client integer rounding of Decimal prices (NPR). */
export const AMOUNT_TOLERANCE_NPR = 1;

export type AmountValidation = { ok: boolean; expected?: number; error?: string };

async function resolveEffectiveAccountDiscount(userId: number): Promise<number> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { account_type: true, business_verification_status: true, individual_verified: true },
  });
  if (!user) return 0;
  if (user.account_type === 'business' && user.business_verification_status === 'approved') return 40;
  if (
    user.account_type === 'individual' &&
    (user.individual_verified || user.business_verification_status === 'verified')
  ) {
    return 20;
  }
  return 0;
}

async function resolveAdPricingTier(adId: number): Promise<string> {
  const ad = await prisma.ads.findUnique({
    where: { id: adId },
    select: {
      categories: {
        select: { id: true, categories: { select: { id: true } } },
      },
    },
  });
  if (!ad?.categories) return 'default';
  const parentCategoryId = ad.categories.categories?.id || ad.categories.id;
  const tierMapping = await prisma.category_pricing_tiers.findFirst({
    where: { category_id: parentCategoryId },
    select: { pricing_tier: true },
  });
  return tierMapping?.pricing_tier || 'default';
}

/**
 * Best currently-active campaign discount for a tier. Deliberately permissive
 * (tier + max-uses filters only, like the clients apply it) — this feeds a price
 * FLOOR, so a lower floor can only accept a legitimately discounted price.
 */
async function bestActiveCampaignDiscount(tier: string): Promise<number> {
  const now = new Date();
  const campaigns = await prisma.promotional_campaigns.findMany({
    where: { is_active: true, start_date: { lte: now }, end_date: { gte: now } },
    select: { discount_percentage: true, applies_to_tiers: true, max_uses: true, current_uses: true },
    orderBy: { discount_percentage: 'desc' },
  });
  const best = campaigns.find((c) => {
    if (c.applies_to_tiers && c.applies_to_tiers.length > 0 && !c.applies_to_tiers.includes(tier)) return false;
    if (c.max_uses && c.current_uses && c.current_uses >= c.max_uses) return false;
    return true;
  });
  return best?.discount_percentage || 0;
}

export async function getAuthoritativeAmount(input: {
  userId: number;
  paymentType: PaymentType;
  relatedId?: number;
  metadata?: Record<string, unknown>;
}): Promise<AmountValidation> {
  const { userId, paymentType, relatedId, metadata } = input;

  if (paymentType === 'ad_promotion') {
    const promotionType = String(metadata?.promotionType || '');
    const durationDays = parseInt(String(metadata?.durationDays ?? ''), 10);
    if (!relatedId || !promotionType || !Number.isFinite(durationDays)) {
      return { ok: false, error: 'Promotion payments require relatedId (adId), promotionType, and durationDays' };
    }

    const ad = await prisma.ads.findUnique({ where: { id: relatedId }, select: { id: true } });
    if (!ad) return { ok: false, error: 'Ad not found' };

    const tier = await resolveAdPricingTier(relatedId);
    let base = await prisma.promotion_pricing.findFirst({
      where: {
        promotion_type: promotionType,
        duration_days: durationDays,
        account_type: 'individual',
        pricing_tier: tier,
        is_active: true,
      },
      select: { price: true },
    });
    if (!base && tier !== 'default') {
      base = await prisma.promotion_pricing.findFirst({
        where: {
          promotion_type: promotionType,
          duration_days: durationDays,
          account_type: 'individual',
          pricing_tier: 'default',
          is_active: true,
        },
        select: { price: true },
      });
    }
    if (!base) return { ok: false, error: 'No active pricing found for the selected promotion' };

    const accountDiscount = await resolveEffectiveAccountDiscount(userId);
    const campaignDiscount = await bestActiveCampaignDiscount(tier);
    const totalDiscount = Math.min(accountDiscount + campaignDiscount, 90);
    const expected = Math.round(parseFloat(base.price.toString()) * (1 - totalDiscount / 100));
    return { ok: true, expected };
  }

  if (paymentType === 'individual_verification' || paymentType === 'business_verification') {
    const vType = paymentType === 'business_verification' ? 'business' : 'individual';
    if (!relatedId) return { ok: false, error: 'Verification payments require relatedId (verification request id)' };

    // Anchor to the verification request's own duration (server-side record).
    const request =
      vType === 'business'
        ? await prisma.business_verification_requests.findUnique({
            where: { id: relatedId },
            select: { user_id: true, duration_days: true },
          })
        : await prisma.individual_verification_requests.findUnique({
            where: { id: relatedId },
            select: { user_id: true, duration_days: true },
          });
    if (!request) return { ok: false, error: 'Verification request not found' };
    if (request.user_id !== userId) return { ok: false, error: 'Verification request belongs to another user' };

    const pricing = await prisma.verification_pricing.findFirst({
      where: {
        verification_type: vType,
        duration_days: request.duration_days || 365,
        is_active: true,
      },
      select: { price: true },
    });
    if (!pricing) return { ok: false, error: 'No active pricing found for this verification' };
    return { ok: true, expected: parseFloat(pricing.price.toString()) };
  }

  return { ok: false, error: 'Unknown payment type' };
}

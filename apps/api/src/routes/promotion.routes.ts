import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync, NotFoundError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Valid pricing tiers
const VALID_TIERS = ['default', 'electronics', 'vehicles', 'property'];

/**
 * GET /api/promotion-pricing (root route)
 * Get all active promotion pricing with tier support
 *
 * Query params:
 * - tier: Filter by pricing tier (optional)
 * - adId: Ad ID to determine tier from ad's category (optional)
 */
router.get(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const { tier, adId } = req.query;

    // If adId is provided, determine tier from ad's category
    let adPricingTier = 'default';
    if (adId) {
      const ad = await prisma.ads.findUnique({
        where: { id: parseInt(adId as string, 10) },
        select: {
          category_id: true,
          categories: {
            select: {
              id: true,
              name: true,
              categories: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      if (ad?.categories) {
        // Get the parent category ID (or current if it's a root category)
        const parentCategoryId = ad.categories.categories?.id || ad.categories.id;

        // Look up tier mapping by category_id
        const tierMapping = await prisma.category_pricing_tiers.findFirst({
          where: {
            category_id: parentCategoryId,
          },
          select: { pricing_tier: true },
        });

        if (tierMapping) {
          adPricingTier = tierMapping.pricing_tier;
        }
      }
    }

    // Build where clause
    const whereClause: Record<string, unknown> = { is_active: true };
    if (tier && VALID_TIERS.includes(tier as string)) {
      whereClause.pricing_tier = tier;
    }

    // Fetch all active promotion pricing
    const pricing = await prisma.promotion_pricing.findMany({
      where: whereClause,
      select: {
        id: true,
        promotion_type: true,
        duration_days: true,
        account_type: true,
        pricing_tier: true,
        price: true,
        discount_percentage: true,
        is_active: true,
      },
      orderBy: [
        { pricing_tier: 'asc' },
        { promotion_type: 'asc' },
        { duration_days: 'asc' },
        { account_type: 'desc' },
      ],
    });

    // Group by tier, then by promotion type and duration
    const pricingByTier: Record<string, Record<string, Record<number, Record<string, unknown>>>> = {};
    const pricingMap: Record<string, Record<number, Record<string, unknown>>> = {};

    pricing.forEach((row) => {
      const pricingTier = row.pricing_tier || 'default';
      const promotionType = row.promotion_type || 'unknown';
      const durationDays = row.duration_days || 0;
      const accountType = row.account_type || 'individual';

      const priceData = {
        id: row.id,
        price: parseFloat(row.price.toString()),
        discountPercentage: row.discount_percentage,
      };

      // Group by tier
      if (!pricingByTier[pricingTier]) {
        pricingByTier[pricingTier] = {};
      }
      if (!pricingByTier[pricingTier][promotionType]) {
        pricingByTier[pricingTier][promotionType] = {};
      }
      if (!pricingByTier[pricingTier][promotionType][durationDays]) {
        pricingByTier[pricingTier][promotionType][durationDays] = {};
      }
      pricingByTier[pricingTier][promotionType][durationDays][accountType] = priceData;

      // Backwards compatible format (default tier only)
      if (pricingTier === 'default') {
        if (!pricingMap[promotionType]) {
          pricingMap[promotionType] = {};
        }
        if (!pricingMap[promotionType][durationDays]) {
          pricingMap[promotionType][durationDays] = {};
        }
        pricingMap[promotionType][durationDays][accountType] = priceData;
      }
    });

    // Transform raw data to camelCase
    const transformedRaw = pricing.map((p) => ({
      id: p.id,
      promotionType: p.promotion_type,
      durationDays: p.duration_days,
      accountType: p.account_type,
      pricingTier: p.pricing_tier,
      price: parseFloat(p.price.toString()),
      discountPercentage: p.discount_percentage,
      isActive: p.is_active,
    }));

    // If adId was provided, include ad-specific pricing using its tier
    let adPricing: Record<string, Record<number, Record<string, unknown>>> | null = null;
    if (adId && pricingByTier[adPricingTier]) {
      adPricing = pricingByTier[adPricingTier];
    }

    res.json({
      success: true,
      data: {
        pricing: pricingMap, // Backwards compatible (default tier)
        pricingByTier, // New: grouped by tier
        tiers: VALID_TIERS,
        raw: transformedRaw,
        // Ad-specific data when adId is provided
        adPricingTier: adId ? adPricingTier : undefined,
        adPricing: adPricing || pricingMap, // Use ad's tier pricing or fallback to default
      },
    });
  })
);

/**
 * GET /api/promotions/pricing or /api/promotion-pricing/pricing
 * Get promotion pricing plans (simple format)
 */
router.get(
  '/pricing',
  catchAsync(async (_req: Request, res: Response) => {
    // Get pricing from database
    const plans = await prisma.promotion_pricing.findMany({
      where: { is_active: true },
      orderBy: [{ promotion_type: 'asc' }, { duration_days: 'asc' }],
    });

    res.json({
      success: true,
      data: plans,
    });
  })
);

/**
 * GET /api/promotions/my-promotions
 * Get current user's active promotions
 */
router.get(
  '/my-promotions',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const promotions = await prisma.ad_promotions.findMany({
      where: {
        OR: [
          { user_id: userId },
          { promoted_by: userId },
        ],
        expires_at: { gt: new Date() },
      },
      include: {
        ads: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: { expires_at: 'desc' },
    });

    res.json({
      success: true,
      data: promotions,
    });
  })
);

/**
 * POST /api/promotions
 * Create a promotion for an ad
 */
router.post(
  '/',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { adId, promotionType, durationDays, paymentReference } = req.body;

    // Find ad (any user can promote any ad)
    const ad = await prisma.ads.findUnique({
      where: { id: parseInt(adId) },
    });

    if (!ad) {
      throw new NotFoundError('Ad not found');
    }

    // Check for existing active promotion
    const existingPromo = await prisma.ad_promotions.findFirst({
      where: {
        ad_id: parseInt(adId),
        is_active: true,
        expires_at: { gt: new Date() },
      },
    });
    const isExtension = existingPromo && existingPromo.promotion_type === promotionType;
    if (existingPromo && !isExtension) {
      const msRemaining = existingPromo.expires_at.getTime() - Date.now();
      const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
      return res.status(409).json({
        success: false,
        message: `Ad already has an active ${existingPromo.promotion_type} promotion. You can only extend the same type.`,
        data: {
          activePromotion: {
            ...existingPromo,
            days_remaining: daysRemaining,
          },
        },
      });
    }

    // Use the payer's account type for pricing
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { account_type: true },
    });

    // Get pricing
    const pricing = await prisma.promotion_pricing.findFirst({
      where: {
        promotion_type: promotionType,
        duration_days: durationDays || 7,
        account_type: user?.account_type || 'individual',
        is_active: true,
      },
    });

    const pricePaid = pricing?.price || 0;
    const duration = durationDays || 7;
    // If extending, add days to existing expiry (so user doesn't lose remaining time)
    const baseDate = isExtension && existingPromo ? existingPromo.expires_at : new Date();
    const expiresAt = new Date(baseDate.getTime() + duration * 24 * 60 * 60 * 1000);

    // Use transaction to atomically create promotion + update ad flags
    const promotion = await prisma.$transaction(async (tx) => {
      // If extending, deactivate old promo record
      if (isExtension && existingPromo) {
        await tx.ad_promotions.update({
          where: { id: existingPromo.id },
          data: { is_active: false },
        });
      }

      const promo = await tx.ad_promotions.create({
        data: {
          ad_id: parseInt(adId),
          user_id: ad.user_id,
          promoted_by: userId,
          promotion_type: promotionType,
          duration_days: duration,
          price_paid: pricePaid,
          account_type: user?.account_type || 'individual',
          payment_reference: paymentReference || null,
          starts_at: new Date(),
          expires_at: expiresAt,
        },
      });

      // Reset all promotion flags, then set only the new one
      const updateData: any = {
        promoted_at: new Date(),
        is_featured: false,
        featured_until: null,
        is_urgent: false,
        urgent_until: null,
        is_sticky: false,
        sticky_until: null,
      };

      if (promotionType === 'featured') {
        updateData.is_featured = true;
        updateData.featured_until = expiresAt;
      } else if (promotionType === 'urgent') {
        updateData.is_urgent = true;
        updateData.urgent_until = expiresAt;
      } else if (promotionType === 'sticky') {
        updateData.is_sticky = true;
        updateData.sticky_until = expiresAt;
      }

      await tx.ads.update({
        where: { id: parseInt(adId) },
        data: updateData,
      });

      return promo;
    });

    // Log if someone else promoted this ad
    if (userId !== ad.user_id) {
      console.log(`🎁 User ${userId} promoted ad ${adId} owned by user ${ad.user_id}`);
    }

    console.log(`✅ Promotion ${isExtension ? 'extended' : 'created'}: ${promotionType} for ad ${adId}`);

    res.status(201).json({
      success: true,
      message: isExtension
        ? `Promotion extended by ${duration} days`
        : 'Promotion created successfully',
      data: promotion,
    });
  })
);

/**
 * GET /api/promotion-pricing/active-campaigns
 * Get currently active promotional campaigns (public endpoint)
 *
 * Query params:
 * - tier: Filter by pricing tier (optional)
 * - promotionType: Filter by promotion type (optional)
 */
router.get(
  '/active-campaigns',
  catchAsync(async (req: Request, res: Response) => {
    const { tier, promotionType } = req.query;
    const now = new Date();

    const campaigns = await prisma.promotional_campaigns.findMany({
      where: {
        is_active: true,
        start_date: { lte: now },
        end_date: { gte: now },
      },
      select: {
        id: true,
        name: true,
        description: true,
        discount_percentage: true,
        promo_code: true,
        banner_text: true,
        banner_emoji: true,
        start_date: true,
        end_date: true,
        applies_to_tiers: true,
        applies_to_promotion_types: true,
        min_duration_days: true,
        max_uses: true,
        current_uses: true,
      },
      orderBy: { discount_percentage: 'desc' },
    });

    const filteredCampaigns = campaigns.filter((c) => {
      if (tier && c.applies_to_tiers && c.applies_to_tiers.length > 0) {
        if (!c.applies_to_tiers.includes(tier as string)) return false;
      }
      if (promotionType && c.applies_to_promotion_types && c.applies_to_promotion_types.length > 0) {
        if (!c.applies_to_promotion_types.includes(promotionType as string)) return false;
      }
      if (c.max_uses && c.current_uses && c.current_uses >= c.max_uses) {
        return false;
      }
      return true;
    });

    const transformedCampaigns = filteredCampaigns.map((c) => {
      const endDate = new Date(c.end_date);
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: c.id,
        name: c.name,
        description: c.description,
        discountPercentage: c.discount_percentage,
        promoCode: c.promo_code,
        bannerText: c.banner_text || `${c.banner_emoji} ${c.name} - ${c.discount_percentage}% OFF!`,
        bannerEmoji: c.banner_emoji,
        startDate: c.start_date,
        endDate: c.end_date,
        daysRemaining,
        appliesToTiers: c.applies_to_tiers,
        appliesToPromotionTypes: c.applies_to_promotion_types,
        minDurationDays: c.min_duration_days,
        usesRemaining: c.max_uses ? c.max_uses - (c.current_uses || 0) : null,
      };
    });

    const bestCampaign = transformedCampaigns.length > 0 ? transformedCampaigns[0] : null;

    res.json({
      success: true,
      data: {
        campaigns: transformedCampaigns,
        bestCampaign,
        hasActiveCampaign: transformedCampaigns.length > 0,
      },
    });
  })
);

// ============================================
// ADMIN PRICING MANAGEMENT ROUTES
// ============================================

/**
 * GET /api/promotion-pricing/admin/all
 * Get all promotion pricing (admin only)
 */
router.get(
  '/admin/all',
  catchAsync(async (_req: Request, res: Response) => {
    const pricings = await prisma.promotion_pricing.findMany({
      orderBy: [
        { pricing_tier: 'asc' },
        { promotion_type: 'asc' },
        { duration_days: 'asc' },
        { account_type: 'asc' },
      ],
    });

    res.json({
      success: true,
      data: { raw: pricings },
    });
  })
);

/**
 * POST /api/promotion-pricing/admin/create
 * Create new promotion pricing (admin only)
 */
router.post(
  '/admin/create',
  catchAsync(async (req: Request, res: Response) => {
    const { promotion_type, duration_days, account_type, pricing_tier, price, discount_percentage } = req.body;

    // Check if pricing already exists for this combination
    const existing = await prisma.promotion_pricing.findFirst({
      where: {
        promotion_type,
        duration_days: parseInt(duration_days),
        account_type,
        pricing_tier: pricing_tier || 'default',
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Pricing for this combination already exists',
      });
    }

    const pricing = await prisma.promotion_pricing.create({
      data: {
        promotion_type,
        duration_days: parseInt(duration_days),
        account_type,
        pricing_tier: pricing_tier || 'default',
        price: parseFloat(price),
        discount_percentage: parseInt(discount_percentage) || 0,
        is_active: true,
      },
    });

    console.log(`✅ Created promotion pricing: ${promotion_type} ${duration_days}d ${account_type} ${pricing_tier}`);

    res.status(201).json({
      success: true,
      data: pricing,
    });
  })
);

/**
 * PUT /api/promotion-pricing/admin/:id
 * Update promotion pricing (admin only)
 */
router.put(
  '/admin/:id',
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { price, discount_percentage, is_active } = req.body;

    const pricing = await prisma.promotion_pricing.update({
      where: { id: parseInt(id) },
      data: {
        price: parseFloat(price),
        discount_percentage: discount_percentage !== undefined ? parseInt(discount_percentage) : undefined,
        is_active: is_active !== undefined ? is_active : undefined,
        updated_at: new Date(),
      },
    });

    console.log(`✅ Updated promotion pricing ID: ${id}`);

    res.json({
      success: true,
      data: pricing,
    });
  })
);

/**
 * DELETE /api/promotion-pricing/admin/:id
 * Deactivate promotion pricing (admin only)
 */
router.delete(
  '/admin/:id',
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const pricing = await prisma.promotion_pricing.update({
      where: { id: parseInt(id) },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });

    console.log(`✅ Deactivated promotion pricing ID: ${id}`);

    res.json({
      success: true,
      data: pricing,
    });
  })
);

/**
 * GET /api/promotions/ad/:adId
 * Get active promotion for a specific ad
 */
router.get(
  '/ad/:adId',
  catchAsync(async (req: Request, res: Response) => {
    const adId = parseInt(req.params.adId);

    const activePromotion = await prisma.ad_promotions.findFirst({
      where: {
        ad_id: adId,
        is_active: true,
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!activePromotion) {
      return res.json({ success: true, data: null });
    }

    const now = new Date();
    const msRemaining = activePromotion.expires_at.getTime() - now.getTime();
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      data: {
        ...activePromotion,
        days_remaining: daysRemaining,
      },
    });
  })
);

/**
 * GET /api/promotions/:id
 * Get promotion details
 */
router.get(
  '/:id',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const promotion = await prisma.ad_promotions.findUnique({
      where: { id: parseInt(id) },
      include: {
        ads: {
          select: {
            id: true,
            title: true,
            user_id: true,
          },
        },
      },
    });

    if (!promotion) {
      throw new NotFoundError('Promotion not found');
    }

    res.json({
      success: true,
      data: promotion,
    });
  })
);

export default router;

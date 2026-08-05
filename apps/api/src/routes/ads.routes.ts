import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync, NotFoundError, ValidationError } from '../middleware/errorHandler.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { uploadAdImages } from '../middleware/upload.js';
import { optimizeImage } from '../middleware/optimizeImage.js';
import {
  getAds,
  getUserAds,
  getAdBySlug,
  getAdById,
  incrementAdViews,
  createAd,
  createAdImages,
  getAdForEdit,
  updateAd,
  updateAdImages,
  deleteAd,
  getDirectPublishInfo,
  recordAdEditSnapshot,
  countLiveEditsThisMonth,
  getAdEditHistoryForOwner,
  MAX_LIVE_EDITS_PER_MONTH,
} from '../services/ad.service.js';
import { logReviewHistory } from '../utils/responseHelpers.js';
import {
  getAdLimits,
  getImageLimitForUser,
  countUserActiveAds,
  calculateExpiresAt,
  getBooleanSetting,
} from '../services/adLimits.service.js';
import { sendNotification, notifyEditors } from '../services/notification.service.js';

const router = Router();

// ============================================================================
// Input Parsers
// ============================================================================

// 🔒 API-M1: bound the free-form attributes payload — it's stored verbatim into
// custom_fields and echoed on the detail response, so an unbounded/oversized blob
// is a payload-DoS + stored-data surface.
const MAX_ATTRIBUTES_BYTES = 8 * 1024; // 8KB
const MAX_ATTRIBUTE_KEYS = 50;

function parseAttributes(attributesStr?: string): Record<string, unknown> {
  if (!attributesStr) return {};
  if (Buffer.byteLength(attributesStr, 'utf8') > MAX_ATTRIBUTES_BYTES) {
    throw new ValidationError('Attributes payload is too large');
  }
  try {
    const parsed = JSON.parse(attributesStr);
    // Only accept a flat-ish plain object; reject arrays/primitives/null.
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    if (Object.keys(parsed).length > MAX_ATTRIBUTE_KEYS) {
      throw new ValidationError('Too many attributes');
    }
    return parsed as Record<string, unknown>;
  } catch (err) {
    if (err instanceof ValidationError) throw err;
    console.error('❌ Failed to parse attributes:', err);
    return {};
  }
}

function parseExistingImages(existingImagesStr?: string): string[] {
  if (!existingImagesStr) return [];
  try {
    return JSON.parse(existingImagesStr);
  } catch (err) {
    console.error('❌ Failed to parse existingImages:', err);
    return [];
  }
}

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /api/ads
 * Get all approved ads with filters
 */
router.get(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const result = await getAds({
      search: req.query.search as string,
      category: (req.query.category || req.query.category_id) as string,
      subcategory: (req.query.subcategory || req.query.subcategory_id) as string,
      location: (req.query.location || req.query.location_id) as string,
      minPrice: req.query.minPrice as string,
      maxPrice: req.query.maxPrice as string,
      condition: req.query.condition as string,
      sortBy: req.query.sortBy as string,
      limit: req.query.limit as string,
      offset: req.query.offset as string,
      isFeatured: req.query.is_featured as string,
    });

    // Short-lived cache — new ads can be approved at any time
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=30');
    res.json({
      success: true,
      data: result.ads,
      pagination: result.pagination,
    });
  })
);

/**
 * GET /api/ads/my-ads
 * Get current user's ads
 */
router.get(
  '/my-ads',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const ads = await getUserAds(userId);

    res.json({
      success: true,
      data: ads,
    });
  })
);

/**
 * GET /api/ads/slug/:slug
 * Get ad by SEO slug
 */
router.get(
  '/slug/:slug',
  optionalAuth,
  catchAsync(async (req: Request, res: Response) => {
    const { slug } = req.params;
    const ad = await getAdBySlug(slug, req.user?.userId);

    if (!ad) {
      throw new NotFoundError('Ad not found');
    }

    await incrementAdViews(ad.id);
    if (req.user?.userId) {
      prisma.ad_views.create({
        data: { ad_id: ad.id, user_id: req.user.userId, ip_address: req.ip },
      }).catch(() => {});
    }
    res.json({ success: true, data: ad });
  })
);

/**
 * GET /api/ads/:id
 * Get ad by ID or slug
 */
router.get(
  '/:id',
  optionalAuth,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const ad = !isNaN(Number(id))
      ? await getAdById(parseInt(id), req.user?.userId)
      : await getAdBySlug(id, req.user?.userId);

    if (!ad) {
      throw new NotFoundError('Ad not found');
    }

    await incrementAdViews(ad.id);
    if (req.user?.userId) {
      prisma.ad_views.create({
        data: { ad_id: ad.id, user_id: req.user.userId, ip_address: req.ip },
      }).catch(() => {});
    }
    res.json({ success: true, data: ad });
  })
);

/**
 * POST /api/ads
 * Create a new ad with images (multipart/form-data)
 */
router.post(
  '/',
  authenticateToken,
  uploadAdImages.array('images', 10),
  optimizeImage('ad'),
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { title, description, price, categoryId, subcategoryId, locationId, attributes } = req.body;

    console.log('📥 Ad creation request:', {
      userId,
      title,
      categoryId,
      subcategoryId,
      files: req.files ? (req.files as Express.Multer.File[]).length : 0,
    });

    // Check phone verification if required
    const requirePhoneVerification = await getBooleanSetting('require_phone_verification', true);
    if (requirePhoneVerification) {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { phone_verified: true },
      });
      if (!user?.phone_verified) {
        throw new ValidationError('Phone verification is required before posting ads');
      }
    }

    // Validate required fields
    if (!title || !description || !categoryId) {
      throw new ValidationError('Title, description, and category are required');
    }

    if (!locationId) {
      throw new ValidationError('Location is required');
    }

    // Enforce ad limits from site_settings
    const [limits, activeAdCount, imageLimit] = await Promise.all([
      getAdLimits(),
      countUserActiveAds(userId),
      getImageLimitForUser(userId),
    ]);

    if (activeAdCount >= limits.maxAdsPerUser) {
      throw new ValidationError(`You have reached the maximum limit of ${limits.maxAdsPerUser} ads`);
    }

    // Enforce image limit based on verification status
    const files = req.files as Express.Multer.File[];
    if (files && files.length > imageLimit) {
      throw new ValidationError(`You can upload a maximum of ${imageLimit} images per ad`);
    }

    // 🔒 API-M2: validate price is a non-negative finite number (0 = free).
    // Prevents negative/NaN prices being persisted.
    let parsedPrice: number | undefined;
    if (price !== undefined && price !== null && price !== '') {
      parsedPrice = parseFloat(price);
      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        throw new ValidationError('Price must be a valid non-negative number');
      }
    }

    // Parse attributes
    const parsedAttributes = parseAttributes(attributes);
    const condition = (parsedAttributes.condition as string) || undefined;
    const { condition: _cond, ...customFields } = parsedAttributes;

    // Trusted business users (verified, not expired, not revoked) publish directly
    const publishInfo = await getDirectPublishInfo(userId);

    // Create ad with expiry
    const ad = await createAd(userId, {
      title,
      description,
      price: parsedPrice,
      categoryId: parseInt(categoryId),
      subcategoryId: subcategoryId ? parseInt(subcategoryId) : undefined,
      locationId: locationId ? parseInt(locationId) : undefined,
      condition,
      customFields,
      expiresAt: calculateExpiresAt(limits.adExpiryDays),
    }, { directPublish: publishInfo.canDirectPublish });

    // Handle uploaded images
    if (files && files.length > 0) {
      await createAdImages(ad.id, files);
    }

    if (publishInfo.canDirectPublish) {
      logReviewHistory(ad.id, 'owner_direct_publish', userId, 'user', null, 'Published live by verified business user (no editor review)')
        .catch((err) => console.error('Review history error:', err));
      // Editors still get notified so abuse of the privilege is visible
      notifyEditors({
        type: 'ad_live_posted',
        title: 'Business ad went live',
        body: `"${ad.title}" was published directly by a verified business (no review).`,
        // The ad is already approved — land editors on the Approved tab
        // filtered to it, not the (empty for this ad) default Pending tab.
        data: {
          route: `/editor/ad-management?status=approved&search=${encodeURIComponent(ad.title)}`,
          adId: String(ad.id),
        },
        referenceId: ad.id,
      }).catch((err) => console.error('Live-ad editor notification error:', err));
    } else {
      // Notify editors that a new ad is pending review (editor APK push + desktop bell)
      notifyEditors({
        type: 'new_ad_pending',
        title: 'New ad pending review',
        body: `"${ad.title}" was just posted and needs review.`,
        data: { route: '/editor/ad-management', adId: String(ad.id) },
        referenceId: ad.id,
      }).catch((err) => console.error('New-ad editor notification error:', err));
    }

    res.status(201).json({
      success: true,
      message: publishInfo.canDirectPublish
        ? 'Ad published successfully. It is now live.'
        : 'Ad created successfully. It will be reviewed by our team shortly.',
      data: ad,
      resultingStatus: ad.status,
    });
  })
);

/**
 * GET /api/ads/:id/edit-context
 * Owner-only: tells the client what will happen if this ad is edited,
 * so the right warning can be shown BEFORE the edit form opens.
 */
router.get(
  '/:id/edit-context',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const existingAd = await getAdForEdit(parseInt(String(req.params.id)), userId);

    if (!existingAd) {
      throw new NotFoundError('Ad not found or you do not have permission to edit it');
    }

    const [publishInfo, editsUsed] = await Promise.all([
      getDirectPublishInfo(userId),
      countLiveEditsThisMonth(existingAd.id),
    ]);

    res.json({
      success: true,
      data: {
        status: existingAd.status,
        canDirectPublish: publishInfo.canDirectPublish,
        // Editing an approved ad takes it offline for re-review unless the user is trusted
        willGoToPending: existingAd.status === 'approved' ? !publishInfo.canDirectPublish : true,
        editLimit: MAX_LIVE_EDITS_PER_MONTH,
        editsUsed,
        editsRemaining: Math.max(0, MAX_LIVE_EDITS_PER_MONTH - editsUsed),
      },
    });
  })
);

/**
 * GET /api/ads/:id/edit-history
 * Owner-only: this ad's edit versions (what the editor panel also sees).
 */
router.get(
  '/:id/edit-history',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const existingAd = await getAdForEdit(parseInt(String(req.params.id)), userId);

    if (!existingAd) {
      throw new NotFoundError('Ad not found or you do not have permission to view its history');
    }

    const rows = await getAdEditHistoryForOwner(existingAd.id);
    res.json({ success: true, data: rows });
  })
);

/**
 * PUT /api/ads/:id
 * Update an ad (supports multipart/form-data for image uploads)
 */
router.put(
  '/:id',
  authenticateToken,
  uploadAdImages.array('images', 10),
  optimizeImage('ad'),
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;
    const { title, description, price, categoryId, subcategoryId, locationId, attributes, existingImages } = req.body;

    console.log('📥 Ad update request:', {
      adId: id,
      userId,
      files: req.files ? (req.files as Express.Multer.File[]).length : 0,
    });

    // Check ownership
    const existingAd = await getAdForEdit(parseInt(id), userId);

    if (!existingAd) {
      throw new NotFoundError('Ad not found or you do not have permission to edit it');
    }

    // Editing an approved (live) ad: trusted business users stay live,
    // everyone else goes back to pending for editor re-review.
    const editingApproved = existingAd.status === 'approved';
    const publishInfo = editingApproved ? await getDirectPublishInfo(userId) : null;
    const directPublish = publishInfo?.canDirectPublish === true;

    if (editingApproved) {
      const editsUsed = await countLiveEditsThisMonth(existingAd.id);
      if (editsUsed >= MAX_LIVE_EDITS_PER_MONTH) {
        throw new ValidationError(
          `You have reached the monthly edit limit (${MAX_LIVE_EDITS_PER_MONTH}) for this ad. You can edit it again next month.`
        );
      }
    }

    // Parse attributes
    const parsedAttributes = parseAttributes(attributes);
    const condition = (parsedAttributes.condition as string) || existingAd.condition;
    const { condition: _cond, ...customFields } = parsedAttributes;

    // Parse existing images to keep
    const imagesToKeep = parseExistingImages(existingImages);

    // Update ad
    const { ad, newStatus } = await updateAd(parseInt(id), existingAd, {
      title,
      description,
      price: price !== undefined ? parseFloat(price) : undefined,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      subcategoryId: subcategoryId ? parseInt(subcategoryId) : undefined,
      locationId: locationId ? parseInt(locationId) : undefined,
      condition,
      customFields,
    }, { directPublish });

    // Every owner edit is snapshotted (Facebook-style version history)
    recordAdEditSnapshot(existingAd, userId, newStatus)
      .catch((err) => console.error('Edit snapshot error:', err));

    if (editingApproved) {
      logReviewHistory(
        ad.id,
        directPublish ? 'owner_edit_live' : 'owner_edit_resubmit',
        userId,
        'user',
        null,
        directPublish
          ? 'Live ad edited by verified business user (stayed live)'
          : 'Live ad edited by owner — sent back to pending for re-review'
      ).catch((err) => console.error('Review history error:', err));

      notifyEditors({
        type: directPublish ? 'ad_live_edited' : 'new_ad_pending',
        title: directPublish ? 'Live ad edited by business' : 'Edited ad needs re-review',
        body: directPublish
          ? `"${ad.title}" was edited by a verified business and is still live.`
          : `"${ad.title}" was edited by its owner and went back to pending.`,
        data: {
          // Direct-published edits stay approved — send editors to the Approved
          // tab filtered to the ad; pending resubmissions keep the default tab.
          route: directPublish
            ? `/editor/ad-management?status=approved&search=${encodeURIComponent(ad.title)}`
            : '/editor/ad-management',
          adId: String(ad.id),
        },
        referenceId: ad.id,
      }).catch((err) => console.error('Edit editor notification error:', err));
    }

    // Track price changes and notify favorites on price drop
    const newPrice = price !== undefined ? parseFloat(price) : undefined;
    if (newPrice && existingAd.price && Number(existingAd.price) !== newPrice) {
      prisma.ad_price_history.create({
        data: {
          ad_id: ad.id,
          old_price: existingAd.price,
          new_price: newPrice,
        },
      }).catch(err => console.error('Price history error:', err));

      // Notify users who favorited this ad if price dropped
      if (newPrice < Number(existingAd.price)) {
        prisma.user_favorites.findMany({
          where: { ad_id: ad.id },
          select: { user_id: true },
        }).then(favUsers => {
          const recipients = favUsers.map(f => f.user_id).filter(uid => uid !== userId);
          if (recipients.length > 0) {
            sendNotification({
              recipientUserIds: recipients,
              type: 'price_drop',
              title: 'Price Drop!',
              body: `"${ad.title}": Rs. ${Number(existingAd.price).toLocaleString()} → Rs. ${newPrice.toLocaleString()}`,
              data: { adId: String(ad.id), route: '/ad' },
              referenceId: ad.id,
            }).catch(err => console.error('Price drop notification error:', err));
          }
        }).catch(() => {});
      }
    }

    // Update images
    const files = req.files as Express.Multer.File[];
    await updateAdImages(ad.id, existingAd.ad_images, imagesToKeep, files || []);

    res.json({
      success: true,
      message: newStatus === 'pending'
        ? 'Ad updated and resubmitted for review'
        : editingApproved && directPublish
          ? 'Ad updated and is still live'
          : 'Ad updated successfully',
      data: ad,
      resultingStatus: newStatus,
    });
  })
);

/**
 * DELETE /api/ads/:id
 * Delete an ad
 */
router.delete(
  '/:id',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;

    const deletedAd = await deleteAd(parseInt(id), userId);

    if (!deletedAd) {
      throw new NotFoundError('Ad not found or you do not have permission to delete it');
    }

    res.json({
      success: true,
      message: 'Ad deleted successfully',
    });
  })
);

export default router;

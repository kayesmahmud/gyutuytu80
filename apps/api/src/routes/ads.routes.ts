import { Router, Request, Response } from 'express';
import { catchAsync, NotFoundError, ValidationError } from '../middleware/errorHandler.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { uploadAdImages } from '../middleware/upload.js';
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
} from '../services/ad.service';

const router = Router();

// ============================================================================
// Input Parsers
// ============================================================================

function parseAttributes(attributesStr?: string): Record<string, unknown> {
  if (!attributesStr) return {};
  try {
    return JSON.parse(attributesStr);
  } catch (err) {
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
      category: req.query.category as string,
      location: req.query.location as string,
      minPrice: req.query.minPrice as string,
      maxPrice: req.query.maxPrice as string,
      condition: req.query.condition as string,
      sortBy: req.query.sortBy as string,
      limit: req.query.limit as string,
      offset: req.query.offset as string,
    });

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
    const ad = await getAdBySlug(slug);

    if (!ad) {
      throw new NotFoundError('Ad not found');
    }

    await incrementAdViews(ad.id);
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
      ? await getAdById(parseInt(id))
      : await getAdBySlug(id);

    if (!ad) {
      throw new NotFoundError('Ad not found');
    }

    await incrementAdViews(ad.id);
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

    // Validate required fields
    if (!title || !description || !categoryId) {
      throw new ValidationError('Title, description, and category are required');
    }

    // Parse attributes
    const parsedAttributes = parseAttributes(attributes);
    const condition = (parsedAttributes.condition as string) || undefined;
    const { condition: _cond, ...customFields } = parsedAttributes;

    // Create ad
    const ad = await createAd(userId, {
      title,
      description,
      price: price ? parseFloat(price) : undefined,
      categoryId: parseInt(categoryId),
      subcategoryId: subcategoryId ? parseInt(subcategoryId) : undefined,
      locationId: locationId ? parseInt(locationId) : undefined,
      condition,
      customFields,
    });

    // Handle uploaded images
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      await createAdImages(ad.id, files);
    }

    res.status(201).json({
      success: true,
      message: 'Ad created successfully. It will be reviewed by our team shortly.',
      data: ad,
    });
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

    // Check if ad is approved
    if (existingAd.status === 'approved') {
      throw new ValidationError('Approved ads cannot be edited. Please contact support if you need to make changes.');
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
    });

    // Update images
    const files = req.files as Express.Multer.File[];
    await updateAdImages(ad.id, existingAd.ad_images, imagesToKeep, files || []);

    res.json({
      success: true,
      message: newStatus === 'pending' ? 'Ad updated and resubmitted for review' : 'Ad updated successfully',
      data: ad,
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

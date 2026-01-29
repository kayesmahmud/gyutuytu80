import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/favorites
 * Get user's favorited ads
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const offset = (page - 1) * limit;

    // Get total count
    const total = await prisma.user_favorites.count({
      where: { user_id: userId },
    });

    // Fetch favorites with ad details
    const favorites = await prisma.user_favorites.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        ad_id: true,
        created_at: true,
        ads: {
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            condition: true,
            status: true,
            slug: true,
            view_count: true,
            is_featured: true,
            is_urgent: true,
            created_at: true,
            categories: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            locations: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
            ad_images: {
              where: { is_primary: true },
              select: {
                file_path: true,
              },
              take: 1,
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit,
    });

    // Transform to camelCase
    const transformedFavorites = favorites.map((fav) => ({
      id: fav.id,
      adId: fav.ad_id,
      createdAt: fav.created_at,
      ad: {
        id: fav.ads.id,
        title: fav.ads.title,
        description: fav.ads.description,
        price: fav.ads.price ? parseFloat(fav.ads.price.toString()) : null,
        condition: fav.ads.condition,
        status: fav.ads.status,
        slug: fav.ads.slug,
        viewCount: fav.ads.view_count,
        isFeatured: fav.ads.is_featured,
        isUrgent: fav.ads.is_urgent,
        createdAt: fav.ads.created_at,
        category: fav.ads.categories
          ? {
              id: fav.ads.categories.id,
              name: fav.ads.categories.name,
              slug: fav.ads.categories.slug,
            }
          : null,
        location: fav.ads.locations
          ? {
              id: fav.ads.locations.id,
              name: fav.ads.locations.name,
              type: fav.ads.locations.type,
            }
          : null,
        primaryImage: fav.ads.ad_images[0]?.file_path || null,
      },
    }));

    res.json({
      success: true,
      data: transformedFavorites,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Favorites fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch favorites',
      error: error.message,
    });
  }
});

/**
 * POST /api/favorites
 * Add ad to favorites
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { adId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!adId) {
      return res.status(400).json({
        success: false,
        message: 'Ad ID is required',
      });
    }

    // Check if ad exists
    const ad = await prisma.ads.findUnique({
      where: { id: parseInt(adId, 10) },
      select: { id: true, status: true, deleted_at: true },
    });

    if (!ad || ad.deleted_at) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found',
      });
    }

    // Check if already favorited
    const existingFavorite = await prisma.user_favorites.findFirst({
      where: {
        user_id: userId,
        ad_id: ad.id,
      },
      select: { id: true },
    });

    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: 'Ad is already in favorites',
      });
    }

    // Add to favorites
    const favorite = await prisma.user_favorites.create({
      data: {
        user_id: userId,
        ad_id: ad.id,
      },
    });

    console.log(`✅ User ${userId} added ad ${ad.id} to favorites`);

    res.status(201).json({
      success: true,
      message: 'Ad added to favorites',
      data: {
        id: favorite.id,
        adId: favorite.ad_id,
        createdAt: favorite.created_at,
      },
    });
  } catch (error: any) {
    console.error('Add favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to favorites',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/favorites/:adId
 * Remove ad from favorites
 */
router.delete('/:adId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const adId = parseInt(req.params.adId, 10);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Find and delete favorite
    const favorite = await prisma.user_favorites.findFirst({
      where: {
        user_id: userId,
        ad_id: adId,
      },
      select: { id: true },
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found',
      });
    }

    await prisma.user_favorites.delete({
      where: { id: favorite.id },
    });

    console.log(`✅ User ${userId} removed ad ${adId} from favorites`);

    res.json({
      success: true,
      message: 'Ad removed from favorites',
    });
  } catch (error: any) {
    console.error('Remove favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove from favorites',
      error: error.message,
    });
  }
});

/**
 * GET /api/favorites/:adId
 * Check if ad is in user's favorites
 */
router.get('/:adId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const adId = parseInt(req.params.adId, 10);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Check if favorited
    const favorite = await prisma.user_favorites.findFirst({
      where: {
        user_id: userId,
        ad_id: adId,
      },
      select: { id: true, created_at: true },
    });

    res.json({
      success: true,
      data: {
        isFavorited: !!favorite,
        favoriteId: favorite?.id || null,
        createdAt: favorite?.created_at || null,
      },
    });
  } catch (error: any) {
    console.error('Check favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check favorite status',
      error: error.message,
    });
  }
});

export default router;

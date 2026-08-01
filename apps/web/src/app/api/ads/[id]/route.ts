import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth, optionalAuth } from '@/lib/auth';
import { removeAdFromIndex } from '@/lib/search';
import { getLocationBreadcrumb } from '@/lib/location';
import {
  transformAdToResponse,
  errorResponse,
  successResponse,
  messageResponse,
  adSelectQuery,
  type AdWithRelations,
} from './helpers';

/**
 * GET /api/ads/:id - Get single ad with full details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adId = parseInt(id, 10);

    if (isNaN(adId)) {
      return errorResponse('Invalid ad ID', 400);
    }

    const viewerId = await optionalAuth(request);

    const ad = await prisma.ads.findUnique({
      where: { id: adId, deleted_at: null },
      select: adSelectQuery,
    }) as AdWithRelations | null;

    if (!ad) {
      return errorResponse('Ad not found', 404);
    }

    // 🔒 DB-3: a non-approved ad is only viewable by its owner; everyone else gets
    // 404 so pending/rejected ads can't be enumerated by sequential ID.
    const isOwner = viewerId != null && ad.users_ads_user_idTousers?.id === viewerId;
    if (ad.status !== 'approved' && !isOwner) {
      return errorResponse('Ad not found', 404);
    }

    // Increment view count (async, don't wait)
    prisma.ads
      .update({ where: { id: adId }, data: { view_count: { increment: 1 } } })
      .catch((error) => console.error('Failed to increment view count:', error));

    const locationHierarchy = ad.locations?.id
      ? await getLocationBreadcrumb(ad.locations.id)
      : [];

    return successResponse(transformAdToResponse(ad, locationHierarchy));
  } catch (error) {
    console.error('Ad fetch error:', error);
    return errorResponse('Failed to fetch ad', 500);
  }
}

/**
 * DELETE /api/ads/:id - Soft delete an ad
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);
    const { id } = await params;
    const adId = parseInt(id, 10);

    if (isNaN(adId)) {
      return errorResponse('Invalid ad ID', 400);
    }

    const existingAd = await prisma.ads.findUnique({
      where: { id: adId },
      select: { id: true, user_id: true, title: true, deleted_at: true },
    });

    if (!existingAd) {
      return errorResponse('Ad not found', 404);
    }

    if (existingAd.deleted_at) {
      return errorResponse('Ad already deleted', 400);
    }

    if (existingAd.user_id !== userId) {
      return errorResponse('You do not have permission to delete this ad', 403);
    }

    await prisma.ads.update({
      where: { id: adId },
      data: { deleted_at: new Date(), deleted_by: userId, status: 'deleted' },
    });

    await prisma.ad_review_history.create({
      data: {
        ad_id: adId,
        action: 'deleted',
        actor_id: userId,
        actor_type: 'user',
        notes: 'User deleted their own ad',
      },
    });

    removeAdFromIndex(adId).catch((error) =>
      console.error('Failed to remove ad from Typesense:', error)
    );

    console.log(`✅ Deleted ad ID: ${adId} (${existingAd.title})`);

    return messageResponse('Ad deleted successfully');
  } catch (error: unknown) {
    console.error('Ad delete error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'Unauthorized') {
      return errorResponse('Authentication required', 401);
    }

    return NextResponse.json(
      { success: false, message: 'Failed to delete ad', error: message },
      { status: 500 }
    );
  }
}

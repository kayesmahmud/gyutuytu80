import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/auth';
import { isValidAdLocationTier } from '@/lib/location/tiers';

/**
 * GET /api/user/location
 * Get user's default location with full hierarchy info
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        location_id: true,
        locations: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            parent_id: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // A stored profile location is often unusable as an ad location: 3,353 users
    // have none at all, and others predate the municipality-or-deeper rule. Fall
    // back to the precise location the seller last posted from, so the post-ad
    // form still prefills. `derived` tells the caller this wasn't their saved
    // default, which is the cue to write it back after a successful post.
    let location = user.locations;
    let derived = false;

    // Usable as an ad location = an area, or a municipality with no areas of
    // its own. Kathmandu Metropolitan City is subdivided, so prefilling it
    // would hand the seller a location the API rejects at submit — the same
    // trap as prefilling a province, just one tier down.
    let usable = isValidAdLocationTier(location?.type);
    if (usable && location?.type === 'municipality') {
      const areaCount = await prisma.locations.count({
        where: { parent_id: location.id, type: 'area' },
      });
      usable = areaCount === 0;
    }

    if (!usable) {
      const lastPreciseAd = await prisma.ads.findFirst({
        where: {
          user_id: userId,
          locations: {
            is: {
              OR: [
                { type: 'area' },
                { type: 'municipality', other_locations: { none: { type: 'area' } } },
              ],
            },
          },
        },
        orderBy: { created_at: 'desc' },
        select: {
          locations: {
            select: { id: true, name: true, slug: true, type: true, parent_id: true },
          },
        },
      });

      if (lastPreciseAd?.locations) {
        location = lastPreciseAd.locations;
        derived = true;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        locationId: location?.id ?? user.location_id,
        location,
        derived,
      },
    });
  } catch (error: any) {
    console.error('Get user location error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to get user location' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/location
 * Update user's default location
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = await requireAuth(request);
    const body = await request.json();
    const { locationSlug } = body;

    let locationId: number | null = null;

    if (locationSlug) {
      // Find location by slug
      const location = await prisma.locations.findUnique({
        where: { slug: locationSlug },
        select: { id: true },
      });

      if (!location) {
        return NextResponse.json(
          { success: false, message: 'Location not found' },
          { status: 404 }
        );
      }

      locationId = location.id;
    }

    // Update user's default location
    await prisma.users.update({
      where: { id: userId },
      data: { location_id: locationId },
    });

    return NextResponse.json({
      success: true,
      message: 'Location updated successfully',
    });
  } catch (error: any) {
    console.error('Update user location error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to update location' },
      { status: 500 }
    );
  }
}

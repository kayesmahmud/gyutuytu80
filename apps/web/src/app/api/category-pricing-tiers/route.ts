import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/auth';

// Valid pricing tiers
const VALID_TIERS = ['default', 'electronics', 'vehicles', 'property'];

/**
 * GET /api/category-pricing-tiers
 * Get all category-to-tier mappings (public endpoint)
 */
export async function GET() {
  try {
    const mappings = await prisma.category_pricing_tiers.findMany({
      select: {
        id: true,
        category_id: true,
        pricing_tier: true,
        created_at: true,
        updated_at: true,
        categories: {
          select: { id: true, name: true },
        },
      },
      orderBy: { category_id: 'asc' },
    });

    // Also get all root categories for the UI
    const categories = await prisma.categories.findMany({
      where: { parent_id: null },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: 'asc' },
    });

    // Transform to camelCase
    const transformedMappings = mappings.map((m) => ({
      id: m.id,
      categoryId: m.category_id,
      categoryName: m.categories.name,
      pricingTier: m.pricing_tier,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          mappings: transformedMappings,
          categories,
          tiers: VALID_TIERS,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Category pricing tiers fetch error:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch category pricing tiers',
        error: err.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/category-pricing-tiers
 * Create or update category-to-tier mapping
 * Requires: Editor or Super Admin role
 *
 * Body:
 * - category_id: number (required)
 * - pricing_tier: 'default' | 'electronics' | 'vehicles' | 'property' (required)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate editor
    const editor = await requireEditor(request);

    const body = await request.json();
    const { category_id, pricing_tier } = body;

    // Validate required fields
    if (!category_id || !pricing_tier) {
      return NextResponse.json(
        {
          success: false,
          message: 'Category ID and pricing tier are required',
        },
        { status: 400 }
      );
    }

    // Validate pricing tier
    if (!VALID_TIERS.includes(pricing_tier)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid pricing tier. Must be: default, electronics, vehicles, or property',
        },
        { status: 400 }
      );
    }

    // Upsert: category_id is unique, so update if exists, create if not
    const result = await prisma.category_pricing_tiers.upsert({
      where: { category_id: parseInt(category_id, 10) },
      update: {
        pricing_tier,
        updated_at: new Date(),
      },
      create: {
        category_id: parseInt(category_id, 10),
        pricing_tier,
      },
      include: {
        categories: { select: { name: true } },
      },
    });

    console.log(`✅ Category pricing tier upserted by editor ${editor.userId}:`, result);

    return NextResponse.json(
      {
        success: true,
        message: 'Category pricing tier saved successfully',
        data: {
          id: result.id,
          categoryId: result.category_id,
          categoryName: result.categories.name,
          pricingTier: result.pricing_tier,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Category pricing tier creation error:', err);

    if (err.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (err.message.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create category pricing tier',
        error: err.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/category-pricing-tiers
 * Remove category-to-tier mapping (reverts to default tier)
 * Requires: Editor or Super Admin role
 *
 * Body:
 * - category_id: number (required)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate editor
    const editor = await requireEditor(request);

    const body = await request.json();
    const { category_id } = body;

    if (!category_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Category ID is required',
        },
        { status: 400 }
      );
    }

    // Hard delete since there's no is_active column
    const result = await prisma.category_pricing_tiers.deleteMany({
      where: { category_id: parseInt(category_id, 10) },
    });

    if (result.count === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Category mapping not found',
        },
        { status: 404 }
      );
    }

    console.log(`✅ Category pricing tier deleted by editor ${editor.userId}: category_id=${category_id}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Category pricing tier removed successfully (will use default tier)',
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Category pricing tier deletion error:', err);

    if (err.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (err.message.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete category pricing tier',
        error: err.message,
      },
      { status: 500 }
    );
  }
}

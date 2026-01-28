/**
 * Ad Service for Next.js API Routes
 * Handles ad listing and creation with transformations
 */

import { prisma } from '@thulobazaar/database';
import { generateSlug, generateSeoSlug } from '@/lib/urls';
import { processMultipleImages } from '@/lib/utils';
import { indexAd } from '@/lib/search';
import { cleanupExpiredPromotionFlags } from '@/lib/promotion/cleanupExpired';

// ============================================================================
// Types
// ============================================================================

export interface AdFilters {
  search?: string | null;
  categoryId?: string | null;
  locationId?: string | null;
  areaId?: string | null;
  minPrice?: string | null;
  maxPrice?: string | null;
  condition?: string | null;
  status?: string;
  sort?: string;
  limit?: number;
  page?: number;
}

export interface CreateAdInput {
  title: string;
  description: string;
  price: number;
  condition: string;
  categoryId: number;
  locationId: number;
  sellerName?: string;
  sellerPhone?: string;
  customFields?: Record<string, unknown>;
  isNegotiable?: boolean;
  latitude?: number;
  longitude?: number;
  googleMapsLink?: string;
}

// ============================================================================
// Transformers
// ============================================================================

export function transformAdForList(ad: any) {
  return {
    id: ad.id,
    title: ad.title,
    description: ad.description,
    price: ad.price ? parseFloat(ad.price.toString()) : null,
    condition: ad.condition,
    status: ad.status,
    slug: ad.slug,
    viewCount: ad.view_count,
    isFeatured: ad.is_featured,
    isUrgent: ad.is_urgent,
    isSticky: ad.is_sticky,
    featuredUntil: ad.featured_until,
    urgentUntil: ad.urgent_until,
    stickyUntil: ad.sticky_until,
    createdAt: ad.created_at,
    updatedAt: ad.updated_at,
    category: ad.categories
      ? {
          id: ad.categories.id,
          name: ad.categories.name,
          slug: ad.categories.slug,
          icon: ad.categories.icon,
        }
      : null,
    location: ad.locations
      ? {
          id: ad.locations.id,
          name: ad.locations.name,
          type: ad.locations.type,
          slug: ad.locations.slug,
        }
      : null,
    user: ad.users_ads_user_idTousers
      ? {
          id: ad.users_ads_user_idTousers.id,
          fullName: ad.users_ads_user_idTousers.full_name,
          avatar: ad.users_ads_user_idTousers.avatar,
          shopSlug: ad.users_ads_user_idTousers.shop_slug,
          individualVerified: ad.users_ads_user_idTousers.individual_verified,
          businessVerificationStatus: ad.users_ads_user_idTousers.business_verification_status,
        }
      : null,
    primaryImage: ad.ad_images?.[0]
      ? {
          id: ad.ad_images[0].id,
          filename: ad.ad_images[0].filename,
          filePath: ad.ad_images[0].file_path,
          isPrimary: ad.ad_images[0].is_primary,
        }
      : null,
  };
}

// ============================================================================
// Query Builders
// ============================================================================

function buildWhereClause(filters: AdFilters) {
  const where: any = {
    status: filters.status || 'approved',
    deleted_at: null,
    users_ads_user_idTousers: {
      is_suspended: false,
      is_active: true,
      deleted_at: null,
    },
  };

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.categoryId) {
    where.category_id = parseInt(filters.categoryId, 10);
  }

  if (filters.locationId) {
    where.location_id = parseInt(filters.locationId, 10);
  }

  if (filters.areaId) {
    where.area_id = parseInt(filters.areaId, 10);
  }

  if (filters.minPrice || filters.maxPrice) {
    where.price = {};
    if (filters.minPrice) where.price.gte = parseFloat(filters.minPrice);
    if (filters.maxPrice) where.price.lte = parseFloat(filters.maxPrice);
  }

  if (filters.condition) {
    where.condition = filters.condition;
  }

  return where;
}

function buildOrderBy(sort: string = 'newest') {
  switch (sort) {
    case 'price_low':
      return { price: 'asc' };
    case 'price_high':
      return { price: 'desc' };
    case 'popular':
      return { view_count: 'desc' };
    case 'newest':
    default:
      return [
        { is_urgent: 'desc' },
        { is_sticky: 'desc' },
        { created_at: 'desc' },
      ];
  }
}

// ============================================================================
// Ad Listing
// ============================================================================

export async function listAds(filters: AdFilters) {
  // Clean up expired promotions before querying
  await cleanupExpiredPromotionFlags();

  const where = buildWhereClause(filters);
  const orderBy = buildOrderBy(filters.sort);
  const limit = Math.min(filters.limit || 20, 100);
  const page = Math.max(filters.page || 1, 1);
  const offset = (page - 1) * limit;

  const [ads, total] = await Promise.all([
    prisma.ads.findMany({
      where,
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
        is_sticky: true,
        featured_until: true,
        urgent_until: true,
        sticky_until: true,
        created_at: true,
        updated_at: true,
        categories: {
          select: { id: true, name: true, slug: true, icon: true },
        },
        locations: {
          select: { id: true, name: true, type: true, slug: true },
        },
        users_ads_user_idTousers: {
          select: {
            id: true,
            full_name: true,
            avatar: true,
            shop_slug: true,
            individual_verified: true,
            business_verification_status: true,
            is_suspended: true,
            is_active: true,
          },
        },
        ad_images: {
          select: { id: true, filename: true, file_path: true, is_primary: true },
          orderBy: [{ is_primary: 'desc' }, { created_at: 'asc' }],
          take: 1,
        },
      },
      orderBy,
      skip: offset,
      take: limit,
    }),
    prisma.ads.count({ where }),
  ]);

  return {
    ads: ads.map(transformAdForList),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
}

// ============================================================================
// Ad Creation
// ============================================================================

export async function createAd(userId: number, input: CreateAdInput, images: File[]) {
  // Get user details if seller info not provided
  let sellerName = input.sellerName;
  let sellerPhone = input.sellerPhone;

  if (!sellerName || !sellerPhone) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { full_name: true, phone: true },
    });

    if (user) {
      sellerName = sellerName || user.full_name || '';
      sellerPhone = sellerPhone || user.phone || '';
    }
  }

  // Generate slug
  const slug = await generateSlug(input.title, input.locationId);

  // Prepare custom fields
  const customFields = {
    ...input.customFields,
    ...(input.isNegotiable !== undefined && { isNegotiable: input.isNegotiable }),
    ...(input.latitude && { latitude: input.latitude }),
    ...(input.longitude && { longitude: input.longitude }),
    ...(input.googleMapsLink && { googleMapsLink: input.googleMapsLink }),
  };

  // Process images
  let processedImages: Awaited<ReturnType<typeof processMultipleImages>> = [];
  if (images.length > 0) {
    processedImages = await processMultipleImages(images, 'uploads/ads', {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 85,
      format: 'jpeg',
    });
  }

  // Create ad
  const ad = await prisma.ads.create({
    data: {
      title: input.title,
      description: input.description,
      price: input.price,
      condition: input.condition,
      category_id: input.categoryId,
      location_id: input.locationId,
      seller_name: sellerName || '',
      seller_phone: sellerPhone || '',
      user_id: userId,
      slug,
      custom_fields: customFields,
      status: 'pending',
    },
  });

  // Save images
  if (processedImages.length > 0) {
    await prisma.ad_images.createMany({
      data: processedImages.map((img, index) => ({
        ad_id: ad.id,
        filename: img.filename,
        file_path: img.filePath,
        original_name: images[index]?.name || img.filename,
        file_size: img.fileSize,
        mime_type: img.mimeType,
        is_primary: index === 0,
      })),
    });
  }

  // Get location for SEO slug
  const location = await prisma.locations.findUnique({
    where: { id: input.locationId },
    select: { name: true, type: true, parent_id: true },
  });

  let areaName: string | null = null;
  let districtName: string | null = null;

  if (location?.type === 'area') {
    areaName = location.name;
    if (location.parent_id) {
      const district = await prisma.locations.findUnique({
        where: { id: location.parent_id },
        select: { name: true, type: true },
      });
      if (district?.type === 'district') {
        districtName = district.name;
      }
    }
  } else if (location?.type === 'district') {
    districtName = location.name;
  }

  const seoSlug = generateSeoSlug(ad.id, ad.title, areaName, districtName);

  // Index to search (async)
  indexAd({
    id: ad.id,
    title: ad.title,
    description: ad.description,
    price: ad.price,
    condition: input.condition,
    category_id: input.categoryId,
    category_name: '',
    location_id: input.locationId,
    location_name: location?.name || '',
    seller_name: sellerName || '',
    seller_phone: sellerPhone || '',
    is_featured: false,
    status: ad.status,
    created_at: ad.created_at,
    updated_at: ad.updated_at,
    primary_image: processedImages[0]?.filePath || '',
    images: processedImages.map((img) => img.filePath),
  }).catch((error) => console.error('Failed to index ad:', error));

  console.log(`✅ Created ad: ${ad.title} with ${processedImages.length} images, SEO slug: ${seoSlug}`);

  return {
    id: ad.id,
    title: ad.title,
    price: ad.price ? parseFloat(ad.price.toString()) : 0,
    slug: ad.slug,
    seoSlug,
    imageCount: processedImages.length,
    createdAt: ad.created_at,
  };
}

// ============================================================================
// Input Parsing
// ============================================================================

export function normalizeCondition(condition?: string): string {
  if (!condition) return 'Used';

  const conditionLower = condition.toLowerCase();
  if (conditionLower === 'brand new' || conditionLower === 'new') {
    return 'Brand New';
  }
  return 'Used';
}

export function parseCustomFields(
  customFieldsStr?: string | null,
  attributesStr?: string | null
): { customFields: Record<string, unknown>; condition?: string } {
  let customFields: Record<string, unknown> = {};
  let condition: string | undefined;

  if (customFieldsStr) {
    try {
      customFields = JSON.parse(customFieldsStr);
    } catch {
      throw new Error('Invalid customFields format');
    }
  } else if (attributesStr) {
    try {
      customFields = JSON.parse(attributesStr);
    } catch {
      throw new Error('Invalid attributes format');
    }
  }

  // Extract condition from custom fields
  if (customFields.condition) {
    condition = normalizeCondition(String(customFields.condition));
    delete customFields.condition;
  }

  return { customFields, condition };
}

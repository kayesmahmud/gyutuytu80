/**
 * Ad Service
 * Handles ad CRUD operations and transformations
 */

import { prisma } from '@thulobazaar/database';
import { PAGINATION } from '../config/constants.js';

// ============================================================================
// Types
// ============================================================================

export interface AdFilters {
  search?: string;
  category?: string;
  subcategory?: string; // Added for precise subcategory filtering
  categoryIds?: number[]; // Added for hierarchical filtering
  location?: string;
  locationIds?: number[]; // Added for hierarchical filtering
  minPrice?: string;
  maxPrice?: string;
  condition?: string;
  sortBy?: string;
  limit?: string;
  offset?: string;
  isFeatured?: string;
}

export interface CreateAdInput {
  title: string;
  description: string;
  price?: number;
  categoryId: number;
  subcategoryId?: number;
  locationId?: number;
  condition?: string;
  isNegotiable?: boolean;
  customFields?: Record<string, unknown>;
  expiresAt?: Date | null;
}

export interface UpdateAdInput {
  title?: string;
  description?: string;
  price?: number;
  categoryId?: number;
  subcategoryId?: number;
  locationId?: number;
  condition?: string;
  customFields?: Record<string, unknown>;
  existingImages?: string[];
}

// ============================================================================
// Transformers
// ============================================================================

export function transformAdForList(ad: any) {
  return {
    id: ad.id,
    title: ad.title,
    description: ad.description,
    price: ad.price,
    condition: ad.condition,
    status: ad.status === 'approved' ? 'active' : ad.status,
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
    categoryId: ad.category_id,
    locationId: ad.location_id,
    categoryName: ad.categories?.name,
    categoryNameNe: ad.categories?.name_ne,
    categoryIcon: ad.categories?.icon,
    locationName: ad.locations?.name,
    locationNameNe: ad.locations?.name_ne,
    accountType: ad.users_ads_user_idTousers?.account_type,
    businessVerificationStatus: ad.users_ads_user_idTousers?.business_verification_status,
    individualVerified: ad.users_ads_user_idTousers?.individual_verified,
    userName: ad.users_ads_user_idTousers?.full_name,
    userAvatar: ad.users_ads_user_idTousers?.avatar,
    latitude: ad.latitude ? Number(ad.latitude) : null,
    longitude: ad.longitude ? Number(ad.longitude) : null,
    publishedAt: ad.reviewed_at || ad.created_at,
    reviewedAt: ad.reviewed_at,
    primaryImage: ad.ad_images?.find((img: any) => img.is_primary)?.filename || ad.ad_images?.[0]?.filename,
    images: ad.ad_images?.map((img: any) => ({
      id: img.id,
      filename: img.filename,
      filePath: img.file_path,
      isPrimary: img.is_primary,
    })) || [],
  };
}

export function transformAdForDashboard(ad: any) {
  return {
    id: ad.id,
    title: ad.title,
    description: ad.description,
    price: ad.price,
    condition: ad.condition,
    status: ad.status === 'approved' ? 'active' : ad.status,
    slug: ad.slug,
    views: ad.view_count,
    viewCount: ad.view_count,
    isFeatured: ad.is_featured,
    isUrgent: ad.is_urgent,
    isSticky: ad.is_sticky,
    featuredUntil: ad.featured_until,
    urgentUntil: ad.urgent_until,
    stickyUntil: ad.sticky_until,
    createdAt: ad.created_at,
    updatedAt: ad.updated_at,
    categoryId: ad.category_id,
    locationId: ad.location_id,
    categoryName: ad.categories?.name,
    categoryNameNe: ad.categories?.name_ne,
    categoryIcon: ad.categories?.icon,
    locationName: ad.locations?.name,
    locationNameNe: ad.locations?.name_ne,
    primaryImage: ad.ad_images?.find((img: any) => img.is_primary)?.filename || ad.ad_images?.[0]?.filename,
    images: ad.ad_images?.map((img: any) => ({
      id: img.id,
      filename: img.filename,
      filePath: img.file_path,
      isPrimary: img.is_primary,
    })) || [],
    attributes: ad.custom_fields,
  };
}

export async function transformAdForDetail(ad: any) {
  const catName = ad.categories?.categories?.name ?? ad.categories?.name;
  const catNameNe = ad.categories?.categories?.name_ne ?? ad.categories?.name_ne;
  const subName = ad.categories?.categories ? ad.categories.name : undefined;
  const subNameNe = ad.categories?.categories ? ad.categories.name_ne : undefined;
  const locName = await getLocationHierarchy(ad.location_id);

  // Get favorites count and location type
  const favoritesCount = await prisma.user_favorites.count({ where: { ad_id: ad.id } });
  const locationRecord = ad.location_id
    ? await prisma.locations.findUnique({ where: { id: ad.location_id }, select: { type: true } })
    : null;

  return {
    ...ad,
    status: ad.status === 'approved' ? 'active' : ad.status,
    latitude: ad.latitude ? Number(ad.latitude) : null,
    longitude: ad.longitude ? Number(ad.longitude) : null,
    // snake_case (web compatibility)
    category_name: catName,
    category_name_ne: catNameNe,
    subcategory_name: subName,
    subcategory_name_ne: subNameNe,
    location_name: locName,
    // camelCase (mobile compatibility)
    categoryName: catName,
    categoryNameNe: catNameNe,
    subcategoryName: subName,
    subcategoryNameNe: subNameNe,
    locationName: locName,
    userName: ad.users_ads_user_idTousers?.full_name,
    userAvatar: ad.users_ads_user_idTousers?.avatar,
    userPhone: ad.users_ads_user_idTousers?.phone,
    googleMapsLink: ad.users_ads_user_idTousers?.google_maps_link,
    userVerified: ad.users_ads_user_idTousers?.business_verification_status === 'verified' || ad.users_ads_user_idTousers?.individual_verified,
    businessVerificationStatus: ad.users_ads_user_idTousers?.business_verification_status,
    individualVerified: ad.users_ads_user_idTousers?.individual_verified,
    shopSlug: ad.users_ads_user_idTousers?.shop_slug,
    accountType: ad.users_ads_user_idTousers?.account_type,
    seller: ad.users_ads_user_idTousers,
    images: ad.ad_images,
    attributes: ad.custom_fields,
    favoritesCount: favoritesCount,
    favorites_count: favoritesCount,
    locationType: locationRecord?.type || null,
    location_type: locationRecord?.type || null,
  };
}

export async function getLocationHierarchy(locationId?: number): Promise<string> {
  if (!locationId) return '';

  try {
    const location = await prisma.locations.findUnique({
      where: { id: locationId },
      include: {
        locations: {
          include: {
            locations: {
              include: {
                locations: true
              }
            }
          }
        }
      }
    });

    if (!location) return '';

    const parts = [location.name];
    let current = location.locations;

    // Traverse up to 3 parent levels (Area -> City -> District -> Province)
    while (current) {
      parts.push(current.name);
      current = current.locations;
    }

    return parts.join(', ');
  } catch (error) {
    console.error('Error fetching location hierarchy:', error);
    return '';
  }
}

// ============================================================================
// Query Helpers
// ============================================================================

/**
 * Recursively get all descendant location IDs (e.g. Province -> Districts -> Municipalities -> Areas)
 */
async function getLocationDescendantIds(locationId: number): Promise<number[]> {
  const location = await prisma.locations.findUnique({
    where: { id: locationId },
    select: { type: true },
  });

  if (!location) return [locationId];

  // If it's an area, just return the ID
  if (location.type === 'area') {
    return [locationId];
  }

  // Determine which children to fetch based on type
  let childIds: number[] = [];

  if (location.type === 'province') {
    // Province -> Districts
    const districts = await prisma.locations.findMany({
      where: { parent_id: locationId, type: 'district' },
      select: { id: true },
    });
    const districtIds = districts.map(d => d.id);
    childIds.push(...districtIds);

    // Districts -> Municipalities
    if (districtIds.length > 0) {
      const municipalities = await prisma.locations.findMany({
        where: { parent_id: { in: districtIds }, type: 'municipality' },
        select: { id: true },
      });
      const municipalityIds = municipalities.map(m => m.id);
      childIds.push(...municipalityIds);

      // Municipalities -> Areas
      if (municipalityIds.length > 0) {
        const areas = await prisma.locations.findMany({
          where: { parent_id: { in: municipalityIds }, type: 'area' },
          select: { id: true },
        });
        childIds.push(...areas.map(a => a.id));
      }
    }
  } else if (location.type === 'district') {
    // District -> Municipalities
    const municipalities = await prisma.locations.findMany({
      where: { parent_id: locationId, type: 'municipality' },
      select: { id: true },
    });
    const municipalityIds = municipalities.map(m => m.id);
    childIds.push(...municipalityIds);

    // Municipalities -> Areas
    if (municipalityIds.length > 0) {
      const areas = await prisma.locations.findMany({
        where: { parent_id: { in: municipalityIds }, type: 'area' },
        select: { id: true },
      });
      childIds.push(...areas.map(a => a.id));
    }
  } else if (location.type === 'municipality') {
    // Municipality -> Areas
    const areas = await prisma.locations.findMany({
      where: { parent_id: locationId, type: 'area' },
      select: { id: true },
    });
    childIds.push(...areas.map(a => a.id));
  }

  // Return the original ID plus all descendant IDs
  return [locationId, ...childIds];
}

/**
 * Get all descendant category IDs (e.g. Parent Category -> Subcategories)
 */
async function getCategoryDescendantIds(categoryId: number): Promise<number[]> {
  // Find all subcategories where parent_id matches
  const subcategories = await prisma.categories.findMany({
    where: { parent_id: categoryId },
    select: { id: true },
  });

  const subcategoryIds = subcategories.map(c => c.id);

  // Return original ID + subcategory IDs
  return [categoryId, ...subcategoryIds];
}

function buildAdWhereClause(filters: AdFilters) {
  const where: any = { status: 'approved' };

  if (filters.search && typeof filters.search === 'string' && filters.search.trim()) {
    where.OR = [
      { title: { contains: filters.search.trim(), mode: 'insensitive' } },
      { description: { contains: filters.search.trim(), mode: 'insensitive' } },
    ];
  }

  if (filters.categoryIds && filters.categoryIds.length > 0) {
    where.category_id = { in: filters.categoryIds };
  } else if (filters.category && filters.category !== 'all' && !isNaN(Number(filters.category))) {
    where.category_id = parseInt(filters.category);
  }

  if (filters.locationIds && filters.locationIds.length > 0) {
    where.location_id = { in: filters.locationIds };
  } else if (filters.location && filters.location !== 'all' && !isNaN(Number(filters.location))) {
    // Fallback if locationIds not provided but location string is
    where.location_id = parseInt(filters.location);
  }

  if (filters.minPrice && !isNaN(Number(filters.minPrice))) {
    where.price = { ...(where.price || {}), gte: parseFloat(filters.minPrice) };
  }

  if (filters.maxPrice && !isNaN(Number(filters.maxPrice))) {
    where.price = { ...(where.price || {}), lte: parseFloat(filters.maxPrice) };
  }

  if (filters.condition && filters.condition !== 'all') {
    // Normalize: accept 'new'/'used' (Flutter) or 'Brand New'/'Used' (web)
    const c = filters.condition.toLowerCase();
    if (c === 'new' || c === 'brand new') {
      where.condition = 'Brand New';
    } else if (c === 'used') {
      where.condition = 'Used';
    } else {
      where.condition = filters.condition;
    }
  }

  if (filters.isFeatured === 'true') {
    where.is_featured = true;
    where.featured_until = { gt: new Date() };
  }

  return where;
}

function buildAdOrderBy(sortBy: string = 'newest') {
  if (sortBy === 'price-low') return { price: 'asc' };
  if (sortBy === 'price-high') return { price: 'desc' };
  if (sortBy === 'oldest') return { reviewed_at: { sort: 'asc', nulls: 'last' } };
  return { reviewed_at: { sort: 'desc', nulls: 'last' } };
}

// ============================================================================
// Condition Normalization
// ============================================================================

/**
 * Normalize condition to only "Brand New" or "Used"
 * This ensures consistent values in the database regardless of input source
 */
function normalizeCondition(condition?: string): string {
  if (!condition) return 'Used';
  const lower = condition.toLowerCase();
  if (lower === 'brand new' || lower === 'new') return 'Brand New';
  return 'Used'; // Default everything else to Used
}

// ============================================================================
// Slug Generation
// ============================================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export async function generateAdSlug(title: string, locationId?: number): Promise<string> {
  const titleSlug = slugify(title);

  let locationSlug = '';
  if (locationId) {
    const location = await prisma.locations.findUnique({
      where: { id: locationId },
      select: { name: true },
    });
    if (location?.name) {
      locationSlug = slugify(location.name);
    }
  }

  const baseSlug = locationSlug
    ? `${titleSlug}-for-sale-in-${locationSlug}`
    : `${titleSlug}-for-sale`;

  // Find existing slugs with this base pattern
  const existingSlugs = await prisma.ads.findMany({
    where: { slug: { startsWith: `${baseSlug}-` } },
    select: { slug: true },
  });

  // Find highest counter
  let maxCounter = 0;
  const counterRegex = new RegExp(`^${baseSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)$`);

  for (const ad of existingSlugs) {
    if (!ad.slug) continue;
    const match = ad.slug.match(counterRegex);
    if (match?.[1]) {
      const counter = parseInt(match[1], 10);
      if (counter > maxCounter) {
        maxCounter = counter;
      }
    }
  }

  return `${baseSlug}-${maxCounter + 1}`;
}

// ============================================================================
// CRUD Operations
// ============================================================================

const adListSelect = {
  include: {
    categories: { select: { name: true, name_ne: true, icon: true } },
    locations: { select: { name: true, name_ne: true } },
    users_ads_user_idTousers: {
      select: {
        account_type: true,
        business_verification_status: true,
        individual_verified: true,
        full_name: true,
        avatar: true,
      },
    },
    ad_images: {
      orderBy: [{ is_primary: 'desc' as const }, { created_at: 'asc' as const }],
    },
  },
};

const adDetailSelect = {
  include: {
    categories: {
      include: {
        categories: true, // parent category via self-relation
      },
    },
    locations: true,
    users_ads_user_idTousers: {
      select: {
        id: true,
        full_name: true,
        phone: true,
        avatar: true,
        account_type: true,
        business_verification_status: true,
        individual_verified: true,
        shop_slug: true,
      },
    },
    ad_images: {
      orderBy: [{ is_primary: 'desc' as const }, { created_at: 'asc' as const }],
    },
  },
};

export async function getAds(filters: AdFilters) {
  // Pre-process location filter to get all descendant IDs
  if (filters.location && filters.location !== 'all' && !isNaN(Number(filters.location))) {
    const locId = parseInt(filters.location);
    const allLocationIds = await getLocationDescendantIds(locId);
    filters.locationIds = allLocationIds;
  }

  // Pre-process category filter
  // 1. If Subcategory is provided, it takes precedence (more specific)
  if (filters.subcategory && filters.subcategory !== 'all' && !isNaN(Number(filters.subcategory))) {
    const subId = parseInt(filters.subcategory);
    const allSubIds = await getCategoryDescendantIds(subId);
    filters.categoryIds = allSubIds;
  }
  // 2. Else if Category is provided
  else if (filters.category && filters.category !== 'all' && !isNaN(Number(filters.category))) {
    const catId = parseInt(filters.category);
    const allCategoryIds = await getCategoryDescendantIds(catId);
    filters.categoryIds = allCategoryIds;
  }

  const where = buildAdWhereClause(filters);
  const orderBy = buildAdOrderBy(filters.sortBy);

  const limitNum = Math.min(
    parseInt(filters.limit || String(PAGINATION.DEFAULT_LIMIT)) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT
  );
  const offsetNum = parseInt(filters.offset || '0') || 0;

  const [ads, total] = await Promise.all([
    prisma.ads.findMany({
      where,
      ...adListSelect,
      orderBy,
      take: limitNum,
      skip: offsetNum,
    }),
    prisma.ads.count({ where }),
  ]);

  return {
    ads: ads.map(transformAdForList),
    pagination: {
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + limitNum < total,
    },
  };
}

export async function getUserAds(userId: number) {
  const ads = await prisma.ads.findMany({
    where: { user_id: userId },
    include: {
      categories: { select: { name: true, name_ne: true, icon: true } },
      locations: { select: { name: true, name_ne: true } },
      ad_images: {
        orderBy: [{ is_primary: 'desc' }, { created_at: 'asc' }],
      },
    },
    orderBy: { created_at: 'desc' },
  });

  return ads.map(transformAdForDashboard);
}

export async function getAdBySlug(slug: string) {
  const ad = await prisma.ads.findFirst({
    where: { slug },
    ...adDetailSelect,
  });

  return ad ? await transformAdForDetail(ad) : null;
}

export async function getAdById(id: number) {
  const ad = await prisma.ads.findUnique({
    where: { id },
    ...adDetailSelect,
  });

  return ad ? await transformAdForDetail(ad) : null;
}

export async function incrementAdViews(adId: number) {
  await prisma.ads.update({
    where: { id: adId },
    data: { view_count: { increment: 1 } },
  });
}

export async function createAd(userId: number, input: CreateAdInput) {
  const finalCategoryId = input.subcategoryId || input.categoryId;
  const slug = await generateAdSlug(input.title, input.locationId);

  const ad = await prisma.ads.create({
    data: {
      title: input.title,
      description: input.description,
      price: input.price ?? null,
      category_id: finalCategoryId,
      location_id: input.locationId || null,
      condition: normalizeCondition(input.condition),
      user_id: userId,
      status: 'pending',
      slug,
      custom_fields: input.customFields && Object.keys(input.customFields).length > 0
        ? input.customFields
        : null,
      expires_at: input.expiresAt ?? null,
    },
    include: {
      categories: true,
      locations: true,
    },
  });

  console.log(`✅ Ad created: ${ad.title} (ID: ${ad.id}) by user ${userId} - Status: pending`);
  return ad;
}

export async function createAdImages(adId: number, files: Express.Multer.File[]) {
  const imageRecords = files.map((file, index) => ({
    ad_id: adId,
    filename: file.filename,
    original_name: file.originalname,
    file_path: `/uploads/ads/${file.filename}`,
    file_size: file.size,
    mime_type: file.mimetype,
    is_primary: index === 0,
  }));

  await prisma.ad_images.createMany({ data: imageRecords });
  console.log(`✅ Uploaded ${files.length} images for ad ${adId}`);
}

export async function getAdForEdit(adId: number, userId: number) {
  return prisma.ads.findFirst({
    where: { id: adId, user_id: userId },
    include: { ad_images: true },
  });
}

export async function updateAd(adId: number, existingAd: any, input: UpdateAdInput) {
  const finalCategoryId = input.subcategoryId
    ? input.subcategoryId
    : input.categoryId
      ? input.categoryId
      : existingAd.category_id;

  // Reset status to pending if previously rejected
  let newStatus = existingAd.status;
  if (existingAd.status === 'rejected') {
    newStatus = 'pending';
    console.log(`📝 Rejected ad ${adId} resubmitted - status changed to pending`);
  }

  const ad = await prisma.ads.update({
    where: { id: adId },
    data: {
      title: input.title || existingAd.title,
      description: input.description || existingAd.description,
      price: input.price !== undefined ? input.price : existingAd.price,
      category_id: finalCategoryId,
      location_id: input.locationId || existingAd.location_id,
      condition: normalizeCondition(input.condition || existingAd.condition),
      custom_fields: input.customFields && Object.keys(input.customFields).length > 0
        ? input.customFields
        : existingAd.custom_fields,
      status: newStatus,
      status_reason: newStatus === 'pending' ? null : existingAd.status_reason,
      updated_at: new Date(),
    },
  });

  console.log(`✅ Ad updated: ${ad.title} (ID: ${ad.id}) - Status: ${newStatus}`);
  return { ad, newStatus };
}

export async function updateAdImages(
  adId: number,
  existingImages: any[],
  imagesToKeep: string[],
  newFiles: Express.Multer.File[]
) {
  const normalizePath = (p: string) => p.replace(/^https?:\/\/[^/]+\//, '').replace(/^\/+/, '');
  const normalizedKeepPaths = imagesToKeep.map(normalizePath);

  // Find images to delete
  const imagesToDelete = existingImages.filter((img) => {
    const normalizedPath = normalizePath(img.file_path || '');
    return !normalizedKeepPaths.includes(normalizedPath);
  });

  // Delete removed images
  if (imagesToDelete.length > 0) {
    await prisma.ad_images.deleteMany({
      where: { id: { in: imagesToDelete.map((img) => img.id) } },
    });
    console.log(`🗑️ Deleted ${imagesToDelete.length} images for ad ${adId}`);
  }

  // Add new images
  if (newFiles.length > 0) {
    const remainingImages = existingImages.length - imagesToDelete.length;
    const shouldSetPrimary = remainingImages === 0;

    const imageRecords = newFiles.map((file, index) => ({
      ad_id: adId,
      filename: file.filename,
      original_name: file.originalname,
      file_path: `/uploads/ads/${file.filename}`,
      file_size: file.size,
      mime_type: file.mimetype,
      is_primary: shouldSetPrimary && index === 0,
    }));

    await prisma.ad_images.createMany({ data: imageRecords });
    console.log(`✅ Added ${newFiles.length} new images for ad ${adId}`);
  }
}

export async function deleteAd(adId: number, userId: number) {
  const existingAd = await prisma.ads.findFirst({
    where: { id: adId, user_id: userId },
  });

  if (!existingAd) return null;

  // Delete images first
  await prisma.ad_images.deleteMany({ where: { ad_id: adId } });

  // Delete the ad
  await prisma.ads.delete({ where: { id: adId } });

  console.log(`✅ Ad deleted: ${existingAd.title} (ID: ${adId})`);
  return existingAd;
}

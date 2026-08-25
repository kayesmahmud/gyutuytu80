// The seller (user who posted the ad) and their verification status.
// Editors use this to know WHO posted a pending ad before approving it.
export interface Seller {
  id: number;
  name: string;
  email?: string;
  accountType?: string; // 'individual' | 'business'
  businessVerified: boolean;
  individualVerified: boolean;
}

export interface Ad {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  subcategory?: string;
  location: string;
  status: string;
  createdAt: string; // when the user POSTED the ad (shown to editors)
  updatedAt: string;
  reviewedAt?: string | null; // when an editor approved/rejected it
  deletedAt?: string | null;
  images?: string[];
  sellerName?: string;
  sellerPhone?: string;
  seller?: Seller | null;
  condition?: string;
  statusReason?: string;
  suspendedUntil?: string | null;
  slug?: string;
  reviewedByName?: string | null;
  reviewedByRole?: string | null;
  deletedByName?: string | null;
}

export type TabStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'deleted' | 'all';

export const TAB_LIST: TabStatus[] = ['pending', 'approved', 'rejected', 'suspended', 'deleted', 'all'];

// Transform API response to component format. /api/editor/ads sends camelCase
// (categoryName); snake_case keys are kept as fallbacks for older endpoints.
export function transformAd(ad: any): Ad {
  // Ads point at their leaf category: with a parent it's a subcategory
  // (Electronics › Mobile Phones), without one it IS the main category.
  const ownCategory = ad.categoryName ?? ad.category_name ?? ad.category ?? '';
  const parentCategory = ad.parentCategoryName ?? ad.parent_category_name ?? null;
  return {
    id: ad.id,
    title: ad.title,
    description: ad.description,
    price: ad.price,
    category: parentCategory || ownCategory,
    subcategory: parentCategory ? ownCategory : undefined,
    location: ad.locationName ?? ad.location_name ?? ad.location ?? '',
    status: ad.status,
    createdAt: ad.created_at || ad.createdAt,
    updatedAt: ad.updated_at || ad.updatedAt,
    reviewedAt: ad.reviewedAt ?? ad.reviewed_at ?? null,
    deletedAt: ad.deleted_at || ad.deletedAt,
    images: ad.images || [],
    sellerName: ad.seller_name || ad.sellerName || ad.user?.fullName || '',
    sellerPhone: ad.seller_phone || ad.sellerPhone,
    seller: ad.user
      ? {
          id: ad.user.id,
          name: ad.user.fullName,
          email: ad.user.email,
          accountType: ad.user.accountType,
          businessVerified: Boolean(ad.user.businessVerified),
          individualVerified: Boolean(ad.user.individualVerified),
        }
      : null,
    condition: ad.condition,
    statusReason: ad.status_reason || ad.statusReason,
    suspendedUntil: ad.suspended_until || ad.suspendedUntil,
    slug: ad.slug,
    reviewedByName: ad.reviewedByName ?? ad.reviewed_by_name ?? null,
    reviewedByRole: ad.reviewedByRole ?? ad.reviewed_by_role ?? null,
    deletedByName: ad.deletedByName ?? ad.deleted_by_name ?? null,
  };
}

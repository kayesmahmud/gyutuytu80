/**
 * Location & Categories Utilities
 * ================================
 * Centralized utilities for location hierarchy and category management
 *
 * Usage:
 *   import { getLocationHierarchy, getRootCategoriesWithChildren } from '@/lib/location';
 */

// Location hierarchy
export {
  getLocationHierarchy,
  getLocationBreadcrumb,
  type LocationType,
  type LocationHierarchyBase,
  type LocationHierarchyArea,
  type LocationHierarchyMunicipality,
  type LocationHierarchyDistrict,
  type LocationHierarchyProvince,
} from './hierarchy';

// Categories
export {
  getRootCategoriesWithChildren,
  getCategoryBySlug,
  getCategoryIdsIncludingChildren,
  type CategoryWithSubcategories,
} from './categories';

// Location tier rules (client-safe)
export {
  MIN_AD_LOCATION_TIER,
  isTierAtLeast,
  isValidAdLocationTier,
} from './tiers';

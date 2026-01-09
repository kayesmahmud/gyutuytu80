/**
 * Shared types for the ads filter system
 * Used by desktop sidebar, mobile drawer, and carousel
 * Designed for future React Native mobile app reuse
 */

export interface FilterUpdates {
  category?: string | null;
  location?: string | null;
  minPrice?: string;
  maxPrice?: string;
  condition?: string;
  sortBy?: string;
}

export interface FilterOption {
  value: string;
  label: string;
  icon?: string | null;
}

export interface UseAdsFiltersProps {
  lang: string;
  selectedCategorySlug?: string;
  selectedLocationSlug?: string;
  minPrice?: string;
  maxPrice?: string;
  condition?: string;
  sortBy?: string;
  searchQuery?: string;
  /** Callback after navigation - useful for closing drawers */
  onNavigate?: () => void;
}

export interface UseAdsFiltersReturn {
  // Navigation
  updateFilters: (updates: FilterUpdates) => void;
  clearAllFilters: () => void;
  updateSort: (sort: string) => void;

  // Labels
  getSortLabel: (sort?: string) => string;
  getConditionLabel: (condition?: string) => string;

  // Active filter counts
  activeFiltersCount: number;
  categoryCount: number;
  locationCount: number;
  priceCount: number;
  conditionCount: number;
}

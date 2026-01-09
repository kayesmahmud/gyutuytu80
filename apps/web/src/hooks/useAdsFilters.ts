'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { buildAdUrl } from '@/lib/urls/client';
import { SORT_OPTIONS, CONDITION_OPTIONS, DEFAULT_SORT } from '@/lib/filters';
import type { FilterUpdates, UseAdsFiltersProps, UseAdsFiltersReturn } from '@/lib/filters';

/**
 * Centralized hook for ads filter logic
 * Used by desktop sidebar, mobile drawer, and carousel
 * Designed for future React Native mobile app reuse
 *
 * @example
 * const { updateFilters, getSortLabel, activeFiltersCount } = useAdsFilters({
 *   lang: 'en',
 *   selectedCategorySlug: 'electronics',
 *   onNavigate: () => closeDrawer()
 * });
 */
export function useAdsFilters({
  lang,
  selectedCategorySlug,
  selectedLocationSlug,
  minPrice = '',
  maxPrice = '',
  condition,
  sortBy,
  searchQuery = '',
  onNavigate,
}: UseAdsFiltersProps): UseAdsFiltersReturn {
  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * Navigate to new URL with updated filters
   * Uses path-based URLs: /ads/{location}/{category}?query=...
   */
  const updateFilters = useCallback(
    (updates: FilterUpdates) => {
      // Determine new category and location (use existing if not updating)
      const newCategory =
        updates.category !== undefined ? updates.category : selectedCategorySlug;
      const newLocation =
        updates.location !== undefined ? updates.location : selectedLocationSlug;

      // Build query parameters (everything except category and location)
      const queryParams: Record<string, string> = {};

      if (searchQuery) {
        queryParams.query = searchQuery;
      }

      // Handle minPrice
      if (updates.minPrice !== undefined) {
        if (updates.minPrice) queryParams.minPrice = updates.minPrice;
      } else if (minPrice) {
        queryParams.minPrice = minPrice;
      }

      // Handle maxPrice
      if (updates.maxPrice !== undefined) {
        if (updates.maxPrice) queryParams.maxPrice = updates.maxPrice;
      } else if (maxPrice) {
        queryParams.maxPrice = maxPrice;
      }

      // Handle condition
      if (updates.condition !== undefined) {
        if (updates.condition) queryParams.condition = updates.condition;
      } else if (condition) {
        queryParams.condition = condition;
      }

      // Handle sortBy
      if (updates.sortBy !== undefined) {
        if (updates.sortBy && updates.sortBy !== DEFAULT_SORT) {
          queryParams.sortBy = updates.sortBy;
        }
      } else if (sortBy && sortBy !== DEFAULT_SORT) {
        queryParams.sortBy = sortBy;
      }

      // Build new URL using helper
      const url = buildAdUrl(lang, newLocation || null, newCategory || null, queryParams);
      router.push(url);

      // Call onNavigate callback (e.g., to close drawer)
      onNavigate?.();
    },
    [
      lang,
      selectedCategorySlug,
      selectedLocationSlug,
      minPrice,
      maxPrice,
      condition,
      sortBy,
      searchQuery,
      router,
      onNavigate,
    ]
  );

  /**
   * Clear all filters except search query
   */
  const clearAllFilters = useCallback(() => {
    const queryParams = searchQuery ? { query: searchQuery } : {};
    const url = buildAdUrl(lang, null, null, queryParams);
    router.push(url);
    onNavigate?.();
  }, [lang, searchQuery, router, onNavigate]);

  /**
   * Update sort only (preserves all other filters)
   * Uses current URL path with updated sortBy param
   */
  const updateSort = useCallback(
    (newSort: string) => {
      const currentParams = new URLSearchParams(searchParams.toString());

      if (newSort && newSort !== DEFAULT_SORT) {
        currentParams.set('sortBy', newSort);
      } else {
        currentParams.delete('sortBy');
      }

      const path = window.location.pathname;
      const queryString = currentParams.toString();
      router.push(queryString ? `${path}?${queryString}` : path);
      onNavigate?.();
    },
    [searchParams, router, onNavigate]
  );

  /**
   * Get display label for sort value
   */
  const getSortLabel = useCallback((sort?: string): string => {
    if (!sort || sort === DEFAULT_SORT) return 'Sort by';
    const option = SORT_OPTIONS.find((opt) => opt.value === sort);
    return option?.label || 'Sort by';
  }, []);

  /**
   * Get display label for condition value
   */
  const getConditionLabel = useCallback((cond?: string): string => {
    if (!cond) return 'Condition';
    const option = CONDITION_OPTIONS.find((opt) => opt.value === cond);
    return option?.label || 'Condition';
  }, []);

  /**
   * Count active filters
   */
  const filterCounts = useMemo(() => {
    const categoryCount = selectedCategorySlug ? 1 : 0;
    const locationCount = selectedLocationSlug ? 1 : 0;
    const priceCount = minPrice || maxPrice ? 1 : 0;
    const conditionCount = condition ? 1 : 0;
    const activeFiltersCount = categoryCount + locationCount + priceCount + conditionCount;

    return {
      activeFiltersCount,
      categoryCount,
      locationCount,
      priceCount,
      conditionCount,
    };
  }, [selectedCategorySlug, selectedLocationSlug, minPrice, maxPrice, condition]);

  return {
    updateFilters,
    clearAllFilters,
    updateSort,
    getSortLabel,
    getConditionLabel,
    ...filterCounts,
  };
}

export default useAdsFilters;

'use client';

import { SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import FilterPill from './FilterPill';
import { SORT_OPTIONS, CONDITION_OPTIONS, DEFAULT_SORT } from '@/lib/filters';

export type FilterSection = 'categories' | 'locations' | 'price' | 'condition' | 'sort';

interface FilterCarouselProps {
  lang: string;
  selectedLocationSlug?: string;
  selectedLocationName?: string;
  selectedCategorySlug?: string;
  selectedCategoryName?: string;
  condition?: string;
  sortBy?: string;
  onOpenDrawer: (section?: FilterSection) => void;
}

/**
 * Horizontal scrollable filter carousel for mobile
 * Similar to bikroy.com's mobile filter bar
 */
export default function FilterCarousel({
  selectedLocationSlug,
  selectedLocationName,
  selectedCategorySlug,
  selectedCategoryName,
  condition,
  sortBy,
  onOpenDrawer,
}: FilterCarouselProps) {
  const t = useTranslations('ads');

  // Get sort label from constants
  const getSortLabel = () => {
    if (!sortBy || sortBy === DEFAULT_SORT) return t('sortBy');
    const option = SORT_OPTIONS.find((opt) => opt.value === sortBy);
    return option?.label || t('sortBy');
  };

  // Get condition label from constants
  const getConditionLabel = () => {
    if (!condition) return t('condition');
    const option = CONDITION_OPTIONS.find((opt) => opt.value === condition);
    return option?.label || t('condition');
  };

  return (
    <div className="lg:hidden sticky top-14 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="relative flex items-center">
        {/* Scrollable Pills Container */}
        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 overflow-x-auto scrollbar-hide pr-14">
          {/* Location Pill */}
          <FilterPill
            label={selectedLocationName || t('allNepal')}
            onClick={() => onOpenDrawer('locations')}
            isActive={!!selectedLocationSlug}
          />

          {/* Category Pill */}
          <FilterPill
            label={selectedCategoryName || t('category')}
            onClick={() => onOpenDrawer('categories')}
            isActive={!!selectedCategorySlug}
          />

          {/* Condition Pill */}
          <FilterPill
            label={getConditionLabel()}
            onClick={() => onOpenDrawer('condition')}
            isActive={!!condition}
          />

          {/* Sort Pill */}
          <FilterPill
            label={getSortLabel()}
            onClick={() => onOpenDrawer('sort')}
            isActive={sortBy !== undefined && sortBy !== DEFAULT_SORT}
          />
        </div>

        {/* Filter Icon Button - Fixed Right with gradient fade */}
        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-2 pl-6 bg-gradient-to-l from-white via-white to-transparent">
          <button
            onClick={() => onOpenDrawer()}
            className="p-2 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors"
            aria-label={t('filters')}
          >
            <SlidersHorizontal className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Hide scrollbar CSS (inline for component isolation) */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

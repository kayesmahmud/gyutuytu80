'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import FilterCarousel from './FilterCarousel';
import MobileFilterDrawer from './MobileFilterDrawer';
import type { FilterSection } from './MobileFilterDrawer';
import type { LocationHierarchyProvince } from '@/lib/location/types';
import { buildAdUrl } from '@/lib/urls/client';

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  subcategories: { id: number; name: string; slug: string }[];
}

interface AdsFilterWrapperProps {
  lang: string;
  categories: Category[];
  locationHierarchy: LocationHierarchyProvince[];
  selectedCategorySlug?: string;
  selectedCategoryName?: string;
  selectedLocationSlug?: string;
  selectedLocationName?: string;
  minPrice?: string;
  maxPrice?: string;
  condition?: 'new' | 'used';
  sortBy?: string;
  searchQuery?: string;
}

/**
 * Client wrapper that combines FilterCarousel and MobileFilterDrawer
 * Manages the shared state between them
 */
export default function AdsFilterWrapper({
  lang,
  categories,
  locationHierarchy,
  selectedCategorySlug,
  selectedCategoryName,
  selectedLocationSlug,
  selectedLocationName,
  minPrice = '',
  maxPrice = '',
  condition,
  sortBy = 'newest',
  searchQuery = '',
}: AdsFilterWrapperProps) {
  const router = useRouter();
  const t = useTranslations('ads');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<FilterSection | undefined>(undefined);
  const [query, setQuery] = useState(searchQuery);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const queryParams: Record<string, string> = {};
    if (query.trim()) {
      queryParams.query = query.trim();
    }

    // Build URL preserving current category/location
    const url = buildAdUrl(
      lang,
      selectedLocationSlug || null,
      selectedCategorySlug || null,
      queryParams
    );

    router.push(url);
  };

  const handleOpenDrawer = (section?: FilterSection) => {
    setActiveSection(section);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    // Reset active section after close animation
    setTimeout(() => setActiveSection(undefined), 300);
  };

  return (
    <>
      {/* Mobile Search Bar - Same style as homepage */}
      <div className="lg:hidden px-4 py-3 bg-gray-50">
        <form onSubmit={handleSearch} className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-lg">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="flex-1 min-w-0 px-3 py-2 border-0 focus:outline-none text-gray-800 text-sm rounded-lg bg-transparent placeholder:text-gray-400"
          />
          <button
            type="submit"
            className="text-white px-3 py-2 rounded-lg font-semibold text-sm transition-all duration-300 hover:shadow-lg flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 flex-shrink-0"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </form>
      </div>

      {/* Filter Carousel - Sticky below header on mobile */}
      <FilterCarousel
        lang={lang}
        selectedLocationSlug={selectedLocationSlug}
        selectedLocationName={selectedLocationName}
        selectedCategorySlug={selectedCategorySlug}
        selectedCategoryName={selectedCategoryName}
        condition={condition}
        sortBy={sortBy}
        onOpenDrawer={handleOpenDrawer}
      />

      {/* Mobile Filter Drawer - Controlled externally by carousel */}
      <MobileFilterDrawer
        lang={lang}
        categories={categories}
        locationHierarchy={locationHierarchy}
        selectedCategorySlug={selectedCategorySlug}
        selectedLocationSlug={selectedLocationSlug}
        selectedLocationName={selectedLocationName}
        minPrice={minPrice}
        maxPrice={maxPrice}
        condition={condition}
        sortBy={sortBy}
        searchQuery={searchQuery}
        externalOpen={isDrawerOpen}
        onExternalClose={handleCloseDrawer}
        initialSection={activeSection}
      />
    </>
  );
}

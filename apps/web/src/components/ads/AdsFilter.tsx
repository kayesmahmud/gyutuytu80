'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import CascadingLocationFilter from '@/components/CascadingLocationFilter';
import FilterSection from '@/components/shared/FilterSection';
import RadioOption from '@/components/shared/RadioOption';
import { useAdsFilters } from '@/hooks/useAdsFilters';
import { CONDITION_OPTIONS } from '@/lib/filters';
import type { LocationHierarchyProvince } from '@/lib/location/types';
import { useLocalizedName } from '@/hooks/useLocalizedName';

interface Category {
  id: number;
  name: string;
  nameNe?: string | null;
  slug: string;
  icon: string | null;
  subcategories: { id: number; name: string; nameNe?: string | null; slug: string }[];
}

interface AdsFilterProps {
  lang: string;
  categories: Category[];
  locationHierarchy: LocationHierarchyProvince[];
  selectedCategorySlug?: string;
  selectedLocationSlug?: string;
  selectedLocationName?: string;
  minPrice?: string;
  maxPrice?: string;
  condition?: 'new' | 'used';
  sortBy?: string;
  searchQuery?: string;
}

export default function AdsFilter({
  lang,
  categories,
  locationHierarchy,
  selectedCategorySlug,
  selectedLocationSlug,
  selectedLocationName,
  minPrice = '',
  maxPrice = '',
  condition,
  sortBy,
  searchQuery = '',
}: AdsFilterProps) {
  // Use centralized filter hook
  const {
    updateFilters,
    clearAllFilters,
    activeFiltersCount,
    categoryCount,
    locationCount,
    priceCount,
    conditionCount,
  } = useAdsFilters({
    lang,
    selectedCategorySlug,
    selectedLocationSlug,
    minPrice,
    maxPrice,
    condition,
    sortBy,
    searchQuery,
  });

  const t = useTranslations('ads');
  const localizedName = useLocalizedName();

  // Track expanded sections
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    location: true,
    price: true,
    condition: true,
  });

  // Local state for price inputs (so user can type full values before applying)
  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);

  // Track expanded categories (multiple can be expanded)
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(() => {
    // Auto-expand parent category if a subcategory is selected
    if (selectedCategorySlug) {
      const selectedCategory = categories.find(
        (cat) =>
          cat.slug === selectedCategorySlug ||
          cat.subcategories?.some((sub) => sub.slug === selectedCategorySlug)
      );
      if (
        selectedCategory &&
        selectedCategory.subcategories?.some((sub) => sub.slug === selectedCategorySlug)
      ) {
        return new Set([selectedCategory.id]);
      }
    }
    return new Set();
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {t('filters')}
          {activeFiltersCount > 0 && (
            <span className="bg-rose-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {activeFiltersCount}
            </span>
          )}
        </h3>
        {activeFiltersCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-rose-500 hover:text-rose-600 transition-colors text-sm font-semibold"
          >
            {t('clearAll')}
          </button>
        )}
      </div>

      {/* Category Filter */}
      <FilterSection
        title={t('category')}
        count={categoryCount}
        isExpanded={expandedSections.category}
        onToggle={() => toggleSection('category')}
      >
        <div className="space-y-1">
          <RadioOption
            label={t('allCategories')}
            checked={!selectedCategorySlug}
            onChange={() => updateFilters({ category: null })}
          />

          {categories.map((cat) => {
            const hasSubcategories = cat.subcategories && cat.subcategories.length > 0;
            const isExpanded = expandedCategories.has(cat.id);
            const isSelected = selectedCategorySlug === cat.slug;

            return (
              <div key={cat.id}>
                {/* Main Category */}
                <div className="flex items-center gap-1">
                  {hasSubcategories && (
                    <button
                      onClick={() => toggleCategory(cat.id)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      <span
                        className="text-xs transition-transform inline-block"
                        style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                      >
                        ▶
                      </span>
                    </button>
                  )}
                  {!hasSubcategories && <span className="w-6" />}
                  <RadioOption
                    label={`${cat.icon} ${localizedName(cat.name, cat.nameNe)}`}
                    checked={isSelected}
                    onChange={() => updateFilters({ category: cat.slug })}
                  />
                </div>

                {/* Subcategories */}
                {hasSubcategories && isExpanded && (
                  <div className="ml-6 space-y-1 mt-1 max-h-48 overflow-y-auto">
                    {cat.subcategories.map((subcat) => (
                      <RadioOption
                        key={subcat.id}
                        label={localizedName(subcat.name, subcat.nameNe)}
                        checked={selectedCategorySlug === subcat.slug}
                        onChange={() => updateFilters({ category: subcat.slug })}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </FilterSection>

      {/* Location Filter */}
      <FilterSection
        title={t('location')}
        count={locationCount}
        isExpanded={expandedSections.location}
        onToggle={() => toggleSection('location')}
      >
        <CascadingLocationFilter
          onLocationSelect={(locationSlug, _locationName) => {
            updateFilters({ location: locationSlug || null });
          }}
          selectedLocationSlug={selectedLocationSlug || null}
          selectedLocationName={selectedLocationName || null}
          initialProvinces={locationHierarchy}
        />
      </FilterSection>

      {/* Price Range */}
      <FilterSection
        title={t('priceRange')}
        count={priceCount}
        isExpanded={expandedSections.price}
        onToggle={() => toggleSection('price')}
      >
        <div className="space-y-3">
          <input
            type="number"
            placeholder="Min"
            value={localMinPrice}
            onChange={(e) => setLocalMinPrice(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
          />
          <input
            type="number"
            placeholder="Max"
            value={localMaxPrice}
            onChange={(e) => setLocalMaxPrice(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
          />
          <button
            onClick={() =>
              updateFilters({
                minPrice: localMinPrice || undefined,
                maxPrice: localMaxPrice || undefined,
              })
            }
            disabled={localMinPrice === minPrice && localMaxPrice === maxPrice}
            className="w-full py-2 px-4 bg-rose-500 text-white text-sm font-medium rounded-md hover:bg-rose-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {t('applyPriceFilter')}
          </button>
        </div>
      </FilterSection>

      {/* Condition Filter */}
      <FilterSection
        title={t('condition')}
        count={conditionCount}
        isExpanded={expandedSections.condition}
        onToggle={() => toggleSection('condition')}
      >
        <div className="space-y-1">
          {CONDITION_OPTIONS.map((opt) => (
            <RadioOption
              key={opt.value}
              label={opt.icon ? `${opt.icon} ${t(opt.label)}` : t(opt.label)}
              checked={opt.value === '' ? !condition : condition === opt.value}
              onChange={() => updateFilters({ condition: opt.value || undefined })}
            />
          ))}
        </div>
      </FilterSection>
    </div>
  );
}

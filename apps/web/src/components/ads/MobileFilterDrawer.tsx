'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import CascadingLocationFilter from '@/components/CascadingLocationFilter';
import { useAdsFilters } from '@/hooks/useAdsFilters';
import { SORT_OPTIONS, CONDITION_OPTIONS, DEFAULT_SORT } from '@/lib/filters';
import type { LocationHierarchyProvince } from '@/lib/location/types';

export type FilterSection = 'categories' | 'locations' | 'price' | 'condition' | 'sort';

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  subcategories: { id: number; name: string; slug: string }[];
}

interface MobileFilterDrawerProps {
  lang: string;
  categories: Category[];
  locationHierarchy: LocationHierarchyProvince[];
  selectedCategorySlug?: string;
  selectedLocationSlug?: string;
  selectedLocationName?: string;
  minPrice?: string;
  maxPrice?: string;
  condition?: 'new' | 'used';
  searchQuery?: string;
  sortBy?: string;
  // External control props
  externalOpen?: boolean;
  onExternalClose?: () => void;
  initialSection?: FilterSection;
}

export default function MobileFilterDrawer({
  lang,
  categories,
  locationHierarchy,
  selectedCategorySlug,
  selectedLocationSlug,
  selectedLocationName,
  minPrice = '',
  maxPrice = '',
  condition,
  searchQuery = '',
  sortBy = 'newest',
  externalOpen,
  onExternalClose,
  initialSection,
}: MobileFilterDrawerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Use external control if provided, otherwise use internal state
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = (open: boolean) => {
    if (externalOpen !== undefined) {
      if (!open && onExternalClose) onExternalClose();
    } else {
      setInternalOpen(open);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Use centralized filter hook with close callback
  const { updateFilters, clearAllFilters, updateSort } = useAdsFilters({
    lang,
    selectedCategorySlug,
    selectedLocationSlug,
    minPrice,
    maxPrice,
    condition,
    sortBy,
    searchQuery,
    onNavigate: handleClose,
  });

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    categories: true,
    locations: false,
    price: false,
    condition: false,
    sort: false,
  });

  // Track expanded categories (for subcategory expansion - matching desktop)
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

  // When drawer opens with initialSection, expand and scroll to that section
  useEffect(() => {
    if (isOpen && initialSection) {
      // Expand the requested section, collapse others
      setExpandedSections({
        categories: initialSection === 'categories',
        locations: initialSection === 'locations',
        price: initialSection === 'price',
        condition: initialSection === 'condition',
        sort: initialSection === 'sort',
      });

      // Scroll to section after a short delay for animation
      setTimeout(() => {
        const sectionEl = sectionRefs.current[initialSection];
        if (sectionEl) {
          sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }
  }, [isOpen, initialSection]);

  // Local state for price inputs
  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);

  const toggleSection = (section: string) => {
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

  const applyPriceFilter = () => {
    updateFilters({ minPrice: localMinPrice, maxPrice: localMaxPrice });
  };

  return (
    <>
      {/* Drawer Overlay - z-[60] to cover BottomNav (z-50) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] lg:hidden animate-fade-in"
          onClick={handleClose}
        />
      )}

      {/* Drawer Content - z-[60] to cover BottomNav (z-50) */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[60] lg:hidden transition-transform duration-300 ease-out max-h-[85vh] flex flex-col ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle Bar */}
        <div className="flex justify-center py-3 border-b border-gray-200">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Filters</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Categories Section - With Subcategories (matching desktop) */}
          <div
            ref={(el) => {
              sectionRefs.current.categories = el;
            }}
            className="border-b border-gray-200"
          >
            <button
              onClick={() => toggleSection('categories')}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-gray-900">Categories</span>
              {expandedSections.categories ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            {expandedSections.categories && (
              <div className="px-6 pb-4 space-y-1">
                {/* All Categories Option */}
                <button
                  onClick={() => updateFilters({ category: null })}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    !selectedCategorySlug
                      ? 'bg-rose-50 text-rose-600'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span className="text-xl">📁</span>
                  <span className="text-sm font-medium">All Categories</span>
                </button>

                {/* Categories with Subcategory Expansion */}
                {categories.map((category) => {
                  const hasSubcategories =
                    category.subcategories && category.subcategories.length > 0;
                  const isExpanded = expandedCategories.has(category.id);
                  const isSelected = selectedCategorySlug === category.slug;
                  const hasSelectedSubcategory = category.subcategories?.some(
                    (sub) => sub.slug === selectedCategorySlug
                  );

                  return (
                    <div key={category.id}>
                      {/* Main Category Row */}
                      <div className="flex items-center">
                        {hasSubcategories && (
                          <button
                            onClick={() => toggleCategory(category.id)}
                            className="p-2 text-gray-500 hover:text-gray-700"
                          >
                            <span
                              className="text-xs transition-transform inline-block"
                              style={{
                                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                              }}
                            >
                              ▶
                            </span>
                          </button>
                        )}
                        {!hasSubcategories && <span className="w-8" />}
                        <button
                          onClick={() => updateFilters({ category: category.slug })}
                          className={`flex-1 text-left flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                            isSelected || hasSelectedSubcategory
                              ? 'bg-rose-50 text-rose-600'
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <span className="text-xl">{category.icon || '📁'}</span>
                          <span className="text-sm font-medium">{category.name}</span>
                        </button>
                      </div>

                      {/* Subcategories */}
                      {hasSubcategories && isExpanded && (
                        <div className="ml-10 space-y-1 mt-1">
                          {category.subcategories.map((subcat) => (
                            <button
                              key={subcat.id}
                              onClick={() => updateFilters({ category: subcat.slug })}
                              className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors ${
                                selectedCategorySlug === subcat.slug
                                  ? 'bg-rose-50 text-rose-600'
                                  : 'hover:bg-gray-100 text-gray-700'
                              }`}
                            >
                              <span className="text-sm font-medium">{subcat.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Locations Section - With Cascading Filter (matching desktop) */}
          <div
            ref={(el) => {
              sectionRefs.current.locations = el;
            }}
            className="border-b border-gray-200"
          >
            <button
              onClick={() => toggleSection('locations')}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-gray-900">Locations</span>
              {expandedSections.locations ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            {expandedSections.locations && (
              <div className="px-6 pb-4">
                <CascadingLocationFilter
                  onLocationSelect={(locationSlug, _locationName) => {
                    updateFilters({ location: locationSlug || null });
                  }}
                  selectedLocationSlug={selectedLocationSlug || null}
                  selectedLocationName={selectedLocationName || null}
                  initialProvinces={locationHierarchy}
                />
              </div>
            )}
          </div>

          {/* Price Section */}
          <div
            ref={(el) => {
              sectionRefs.current.price = el;
            }}
            className="border-b border-gray-200"
          >
            <button
              onClick={() => toggleSection('price')}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-gray-900">Price Range</span>
              {expandedSections.price ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            {expandedSections.price && (
              <div className="px-6 pb-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Price (NPR)
                  </label>
                  <input
                    type="number"
                    value={localMinPrice}
                    onChange={(e) => setLocalMinPrice(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Price (NPR)
                  </label>
                  <input
                    type="number"
                    value={localMaxPrice}
                    onChange={(e) => setLocalMaxPrice(e.target.value)}
                    placeholder="Any"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={applyPriceFilter}
                  className="w-full px-4 py-3 bg-rose-500 text-white rounded-lg font-semibold hover:bg-rose-600 transition-colors"
                >
                  Apply Price Filter
                </button>
              </div>
            )}
          </div>

          {/* Condition Section - Using Constants */}
          <div
            ref={(el) => {
              sectionRefs.current.condition = el;
            }}
            className="border-b border-gray-200"
          >
            <button
              onClick={() => toggleSection('condition')}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-gray-900">Condition</span>
              {expandedSections.condition ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            {expandedSections.condition && (
              <div className="px-6 pb-4 space-y-2">
                {CONDITION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateFilters({ condition: opt.value || undefined })}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      opt.value === ''
                        ? !condition
                          ? 'bg-rose-50 text-rose-600'
                          : 'hover:bg-gray-100 text-gray-700'
                        : condition === opt.value
                          ? 'bg-rose-50 text-rose-600'
                          : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="text-sm font-medium">
                      {opt.icon ? `${opt.icon} ${opt.label}` : opt.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort Section - Using Constants */}
          <div
            ref={(el) => {
              sectionRefs.current.sort = el;
            }}
            className="border-b border-gray-200"
          >
            <button
              onClick={() => toggleSection('sort')}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-gray-900">Sort By</span>
              {expandedSections.sort ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            {expandedSections.sort && (
              <div className="px-6 pb-4 space-y-2">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateSort(opt.value)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      (opt.value === DEFAULT_SORT && (!sortBy || sortBy === DEFAULT_SORT)) ||
                      sortBy === opt.value
                        ? 'bg-rose-50 text-rose-600'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="text-sm font-medium">
                      {opt.icon ? `${opt.icon} ${opt.label}` : opt.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={clearAllFilters}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-center"
          >
            Reset
          </button>
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-3 bg-rose-500 text-white rounded-lg font-semibold hover:bg-rose-600 transition-colors"
          >
            Show Results
          </button>
        </div>
      </div>
    </>
  );
}

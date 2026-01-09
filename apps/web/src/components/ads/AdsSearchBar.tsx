'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { buildAdUrl } from '@/lib/urls/client';

interface AdsSearchBarProps {
  lang: string;
  initialQuery?: string;
  selectedCategorySlug?: string;
  selectedLocationSlug?: string;
}

export default function AdsSearchBar({
  lang,
  initialQuery = '',
  selectedCategorySlug,
  selectedLocationSlug,
}: AdsSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
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

  const handleClear = () => {
    setQuery('');

    // Navigate without query but keep filters
    const url = buildAdUrl(
      lang,
      selectedLocationSlug || null,
      selectedCategorySlug || null,
      {}
    );

    router.push(url);
  };

  return (
    <div className="hidden lg:block bg-white border border-gray-200 rounded-xl p-4 mb-6">
      <form onSubmit={handleSubmit} className="flex gap-2 md:gap-3">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-3 md:left-4 flex items-center pointer-events-none">
            <svg
              className="w-4 h-4 md:w-5 md:h-5 text-gray-400"
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
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for anything..."
            className="w-full pl-10 md:pl-12 pr-10 md:pr-12 py-2.5 md:py-3 border border-gray-300 rounded-lg md:rounded-xl focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all text-gray-900 placeholder-gray-400 text-sm md:text-base"
          />

          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-3 md:right-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <button
          type="submit"
          className="px-4 md:px-6 py-2.5 md:py-3 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-lg md:rounded-xl transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
        >
          <span className="hidden sm:inline">Search</span>
          <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </form>
    </div>
  );
}

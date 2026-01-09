'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface SortDropdownProps {
  currentSort: string;
  basePath: string;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export default function SortDropdown({ currentSort, basePath }: SortDropdownProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;

    // Build new URL with updated sort parameter
    const params = new URLSearchParams(searchParams.toString());

    if (newSort === 'newest') {
      params.delete('sortBy'); // Default, no need to include
    } else {
      params.set('sortBy', newSort);
    }

    // Reset to page 1 when sorting changes
    params.delete('page');

    const queryString = params.toString();
    const url = queryString ? `${basePath}?${queryString}` : basePath;
    router.push(url);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm text-gray-500 whitespace-nowrap hidden sm:inline">
        Sort by:
      </label>
      <select
        id="sort"
        value={currentSort}
        onChange={handleSortChange}
        className="text-sm px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent cursor-pointer"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

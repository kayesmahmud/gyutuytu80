'use client';

import CategoryIcon from '../../CategoryIcon';
import type { Category } from './types';

interface CategoryTileGridProps {
  categories: Category[];
  selectedId: string;
  onSelect: (categoryId: string) => void;
}

/**
 * Home-screen-style category picker: all 16 categories as icon tiles.
 * Replaces the native <select>, which cannot render the PNG icons.
 */
export function CategoryTileGrid({ categories, selectedId, onSelect }: CategoryTileGridProps) {
  return (
    // App-style compact grid: 4-up on phones, densifying up to 8-up on desktop
    // so the 16 categories sit in 2 rows instead of 4 stretched-flat ones.
    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
      {categories.map((cat) => {
        const selected = selectedId === cat.id.toString();
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id.toString())}
            aria-pressed={selected}
            className={`flex flex-col items-center justify-start gap-1.5 px-1.5 py-3 rounded-xl border-2 transition-colors cursor-pointer ${
              selected
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50'
            }`}
          >
            <CategoryIcon slug={cat.slug} emoji={cat.icon} name={cat.name} size={40} />
            <span
              className={`text-[11px] font-medium text-center leading-tight ${
                selected ? 'text-indigo-700' : 'text-gray-700'
              }`}
            >
              {cat.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

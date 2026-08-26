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
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {categories.map((cat) => {
        const selected = selectedId === cat.id.toString();
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id.toString())}
            aria-pressed={selected}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-colors cursor-pointer ${
              selected
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50'
            }`}
          >
            <CategoryIcon slug={cat.slug} emoji={cat.icon} name={cat.name} size={44} />
            <span
              className={`text-xs font-medium text-center leading-tight ${
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

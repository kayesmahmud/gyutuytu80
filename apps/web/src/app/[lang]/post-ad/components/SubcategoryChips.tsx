'use client';

import type { Category } from './types';

interface SubcategoryChipsProps {
  subcategories: Category[];
  selectedId: string;
  onSelect: (subcategoryId: string) => void;
}

/** Subcategories as tappable chips below the category tile grid. */
export function SubcategoryChips({ subcategories, selectedId, onSelect }: SubcategoryChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {subcategories.map((sub) => {
        const selected = selectedId === sub.id.toString();
        return (
          <button
            key={sub.id}
            type="button"
            onClick={() => onSelect(sub.id.toString())}
            aria-pressed={selected}
            className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors cursor-pointer ${
              selected
                ? 'border-indigo-500 bg-indigo-500 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:border-indigo-300 hover:bg-gray-50'
            }`}
          >
            {sub.name}
          </button>
        );
      })}
    </div>
  );
}

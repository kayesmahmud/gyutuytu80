'use client';

import CategoryIcon from '../../CategoryIcon';
import type { Category } from './types';

interface SubcategoryTileGridProps {
  subcategories: Category[];
  selectedId: string;
  onSelect: (subcategoryId: string) => void;
}

/**
 * Subcategory picker, matching CategoryTileGrid so both steps of the category
 * choice look and behave the same. Icons are keyed by slug, exactly as the
 * parent grid does, and fall back to the emoji when a PNG is missing.
 */
export function SubcategoryTileGrid({
  subcategories,
  selectedId,
  onSelect,
}: SubcategoryTileGridProps) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
      {subcategories.map((sub) => {
        const selected = selectedId === sub.id.toString();
        return (
          <button
            key={sub.id}
            type="button"
            onClick={() => onSelect(sub.id.toString())}
            aria-pressed={selected}
            className={`flex flex-col items-center justify-start gap-1.5 px-1.5 py-3 rounded-xl border-2 transition-colors cursor-pointer ${
              selected
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50'
            }`}
          >
            {/* A touch smaller than the parent grid's 40px, so the two read as
                a hierarchy — matching the Flutter picker. */}
            <CategoryIcon slug={sub.slug} emoji={sub.icon} name={sub.name} size={34} />
            <span
              className={`text-[11px] font-medium text-center leading-tight ${
                selected ? 'text-indigo-700' : 'text-gray-700'
              }`}
            >
              {sub.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

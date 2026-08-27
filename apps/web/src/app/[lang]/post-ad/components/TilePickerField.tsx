'use client';

import { useState } from 'react';
import CategoryIcon from '../../CategoryIcon';
import type { Category } from './types';

interface TilePickerFieldProps {
  items: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder: string;
  /** Tile icon size; the subcategory picker uses a touch smaller than the
      parent so the two read as a hierarchy — matching the Flutter picker. */
  iconSize?: number;
}

/**
 * Dropdown-style category picker matching the Flutter app: a collapsed
 * select-like field showing the current choice; clicking it unfolds the
 * icon-tile grid, and picking a tile folds it back. Replaces the native
 * <select>, which cannot render the PNG icons.
 */
export function TilePickerField({
  items,
  selectedId,
  onSelect,
  placeholder,
  iconSize = 40,
}: TilePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = items.find((item) => item.id.toString() === selectedId);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-300 bg-white text-left cursor-pointer transition-colors hover:border-indigo-300"
      >
        {selected ? (
          <>
            <CategoryIcon
              slug={selected.slug}
              emoji={selected.icon}
              name={selected.name}
              size={28}
            />
            <span className="font-medium text-gray-900">{selected.name}</span>
          </>
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
        <svg
          className={`ml-auto w-5 h-5 text-gray-400 shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        // 3-up on phones to mirror the Flutter picker sheet, densifying to
        // 8-up on desktop so the 16 categories sit in 2 rows.
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 mt-2">
          {items.map((item) => {
            const isSelected = selectedId === item.id.toString();
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelect(item.id.toString());
                  setOpen(false);
                }}
                aria-pressed={isSelected}
                className={`flex flex-col items-center justify-start gap-1.5 px-1.5 py-3 rounded-xl border-2 transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50'
                }`}
              >
                <CategoryIcon
                  slug={item.slug}
                  emoji={item.icon}
                  name={item.name}
                  size={iconSize}
                />
                <span
                  className={`text-[11px] font-medium text-center leading-tight ${
                    isSelected ? 'text-indigo-700' : 'text-gray-700'
                  }`}
                >
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

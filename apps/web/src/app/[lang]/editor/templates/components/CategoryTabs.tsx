'use client';

import type { CategoryType, CategoryConfig } from '../types';

interface CategoryTabsProps {
  categories: CategoryConfig[];
  activeCategory: CategoryType;
  onCategoryChange: (category: CategoryType) => void;
}

export default function CategoryTabs({ categories, activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 flex gap-1 overflow-x-auto whitespace-nowrap scrollbar-hide">
      {categories.map((category) => (
        <button
          key={category.value}
          onClick={() => onCategoryChange(category.value as CategoryType)}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${
            activeCategory === category.value
              ? 'bg-teal-500 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {category.icon} {category.label}
        </button>
      ))}
    </div>
  );
}

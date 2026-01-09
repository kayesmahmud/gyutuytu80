'use client';

import { ChevronDown } from 'lucide-react';

interface FilterPillProps {
  label: string;
  onClick: () => void;
  isActive?: boolean;
}

/**
 * Pill-style button for filter carousel
 * Shows active state with rose theme when filter is selected
 */
export default function FilterPill({ label, onClick, isActive = false }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm whitespace-nowrap transition-colors ${
        isActive
          ? 'border-rose-500 bg-rose-50 text-rose-700 hover:bg-rose-100 active:bg-rose-200'
          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100'
      }`}
    >
      <span className="truncate max-w-[120px]">{label}</span>
      <ChevronDown className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-rose-500' : 'text-gray-500'}`} />
    </button>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import CategoryIcon from '../../CategoryIcon';
import type { Category } from './types';

interface SuggestionChipProps {
  category: Category;
  subcategory: Category | null;
  onApply: () => void;
}

/**
 * Tappable category suggestion shown under the title input when the
 * keyword matcher recognizes the title. Never auto-selects — one tap applies.
 */
export function SuggestionChip({ category, subcategory, onApply }: SuggestionChipProps) {
  const t = useTranslations('ads');

  return (
    <button
      type="button"
      onClick={onApply}
      className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-full border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
    >
      <CategoryIcon slug={category.slug} emoji={category.icon} name={category.name} size={20} />
      <span className="text-sm text-indigo-900">
        <span className="font-medium">{t('suggestedCategory')}:</span> {category.name}
        {subcategory ? ` › ${subcategory.name}` : ''}
      </span>
      <span className="text-xs text-indigo-500">{t('tapToUse')}</span>
    </button>
  );
}

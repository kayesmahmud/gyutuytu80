'use client';

import type { PromotionType } from './hooks/usePromotionPricing';

interface PromotionTypeSelectorProps {
  selectedType: PromotionType;
  onSelect: (type: PromotionType) => void;
}

const promotionTypes = [
  {
    type: 'featured' as const,
    emoji: '⭐',
    title: 'FEATURED',
    description: 'Maximum visibility across entire platform',
    features: ['Homepage carousel', 'Top of search results', 'Category highlights'],
    color: 'yellow',
  },
  {
    type: 'urgent' as const,
    emoji: '🔥',
    title: 'URGENT SALE',
    description: 'Priority placement for quick sales',
    features: ['Top of category', 'Above sticky ads', 'Urgent badge'],
    color: 'red',
  },
  {
    type: 'sticky' as const,
    emoji: '📌',
    title: 'STICKY',
    description: 'Stay at top of category listings',
    features: ['Category visibility', 'Cost-effective', 'Consistent placement'],
    color: 'blue',
  },
];

export function PromotionTypeSelector({ selectedType, onSelect }: PromotionTypeSelectorProps) {
  return (
    <div className="mb-6 sm:mb-8">
      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Choose Promotion Type</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {promotionTypes.map(({ type, emoji, title, description, features, color }) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className={`p-4 sm:p-6 rounded-xl border-2 transition-all text-left ${
              selectedType === type
                ? `border-${color}-500 bg-${color}-50 shadow-lg`
                : `border-gray-200 hover:border-${color}-300 hover:shadow-md`
            }`}
          >
            <div className="text-2xl sm:text-3xl mb-2">{emoji}</div>
            <h4 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">{title}</h4>
            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">{description}</p>
            <ul className="text-xs text-gray-500 space-y-1 hidden sm:block">
              {features.map((feature) => (
                <li key={feature}>✓ {feature}</li>
              ))}
            </ul>
          </button>
        ))}
      </div>
    </div>
  );
}

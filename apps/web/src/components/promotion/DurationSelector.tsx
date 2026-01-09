'use client';

import type { Duration } from './hooks/usePromotionPricing';

interface DurationSelectorProps {
  selectedDuration: Duration;
  onSelect: (duration: Duration) => void;
}

const durations: Duration[] = [3, 7, 15];

export function DurationSelector({ selectedDuration, onSelect }: DurationSelectorProps) {
  return (
    <div className="mb-6 sm:mb-8">
      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Select Duration</h3>
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {durations.map((days) => (
          <button
            key={days}
            onClick={() => onSelect(days)}
            className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
              selectedDuration === days
                ? 'border-rose-500 bg-rose-500 text-white shadow-lg'
                : 'border-gray-200 hover:border-rose-500 hover:shadow-md'
            }`}
          >
            <div className="text-xl sm:text-2xl font-bold">{days}</div>
            <div className="text-xs sm:text-sm">days</div>
          </button>
        ))}
      </div>
    </div>
  );
}

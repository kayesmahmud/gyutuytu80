'use client';

import type { AccountType } from './hooks/usePromotionPricing';

interface AccountTypeBadgeProps {
  accountType: AccountType;
}

export function AccountTypeBadge({ accountType }: AccountTypeBadgeProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 sm:gap-3">
      <span className="text-sm font-medium text-gray-600">Your Account:</span>
      {accountType === 'business' ? (
        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold flex items-center gap-1">
          <span className="hidden sm:inline">✨</span> Verified Business Seller (40% OFF)
        </span>
      ) : accountType === 'individual_verified' ? (
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold flex items-center gap-1">
          <span className="hidden sm:inline">✓</span> Verified Individual Seller (20% OFF)
        </span>
      ) : (
        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">
          Individual Seller (Standard Price)
        </span>
      )}
    </div>
  );
}

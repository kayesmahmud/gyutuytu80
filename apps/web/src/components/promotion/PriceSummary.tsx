'use client';

import type { AccountType, ActiveCampaign } from './hooks/usePromotionPricing';

interface PriceSummaryProps {
  currentPrice: number;
  originalPrice: number;
  totalDiscount: number;
  savings: number;
  accountDiscount: number;
  priceAfterAccountDiscount: number;
  userAccountType: AccountType;
  activeCampaign: ActiveCampaign | null;
}

export function PriceSummary({
  currentPrice,
  originalPrice,
  totalDiscount,
  savings,
  accountDiscount,
  priceAfterAccountDiscount,
  userAccountType,
  activeCampaign,
}: PriceSummaryProps) {
  const hasDiscount = accountDiscount > 0 || activeCampaign;

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 sm:p-6 mb-6">
      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Price Summary</h3>
      <div className="space-y-2 sm:space-y-3">
        {/* Original Price */}
        {hasDiscount && (
          <div className="flex justify-between items-center text-gray-500 text-sm sm:text-base">
            <span>Original Price:</span>
            <span className="line-through">NPR {originalPrice.toLocaleString()}</span>
          </div>
        )}

        {/* Account Type Discount */}
        {accountDiscount > 0 && (
          <div className="flex justify-between items-center text-blue-600 font-medium text-sm sm:text-base">
            <span className="flex items-center gap-1">
              {userAccountType === 'business' ? '✨ Business Discount' : '✓ Verified Discount'} ({accountDiscount}%):
            </span>
            <span>- NPR {(originalPrice - priceAfterAccountDiscount).toLocaleString()}</span>
          </div>
        )}

        {/* Campaign Discount */}
        {activeCampaign && activeCampaign.discountPercentage > 0 && (
          <div className="flex justify-between items-center text-green-600 font-medium text-sm sm:text-base">
            <span className="flex items-center gap-1">
              {activeCampaign.bannerEmoji} {activeCampaign.name} ({activeCampaign.discountPercentage}%):
            </span>
            <span>- NPR {(priceAfterAccountDiscount - currentPrice).toLocaleString()}</span>
          </div>
        )}

        {/* Total Savings */}
        {hasDiscount && (
          <div className="flex justify-between items-center text-green-700 font-semibold text-sm sm:text-base bg-green-50 -mx-4 px-4 py-2 rounded-lg">
            <span>🎉 Total Savings:</span>
            <span>NPR {savings.toLocaleString()} ({totalDiscount}% OFF)</span>
          </div>
        )}

        {/* Final Price */}
        <div className="flex justify-between items-center text-xl sm:text-2xl font-bold text-rose-500 border-t-2 pt-3">
          <span>Total:</span>
          <span>NPR {currentPrice.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

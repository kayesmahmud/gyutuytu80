'use client';

import type { ActiveCampaign } from './hooks/usePromotionPricing';

interface CampaignBannerProps {
  campaign: ActiveCampaign;
}

export function CampaignBanner({ campaign }: CampaignBannerProps) {
  return (
    <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{campaign.bannerEmoji || '🎉'}</span>
          <div>
            <h4 className="font-bold text-green-800">{campaign.name}</h4>
            <p className="text-sm text-green-700">
              Extra {campaign.discountPercentage}% OFF automatically applied!
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-green-500 text-white rounded-full text-sm font-bold">
            -{campaign.discountPercentage}%
          </span>
          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
            ⏰ {campaign.daysRemaining} days left
          </span>
        </div>
      </div>
      {campaign.promoCode && (
        <div className="mt-3 flex items-center gap-2 p-2 bg-green-100 rounded-lg">
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm text-green-700">
            Promo Code: <strong className="font-mono">{campaign.promoCode}</strong> - Automatically Applied!
          </span>
        </div>
      )}
    </div>
  );
}

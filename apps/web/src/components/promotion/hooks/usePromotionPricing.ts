'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';

export interface PricingData {
  [promotionType: string]: {
    [duration: number]: {
      individual: { price: number; discount_percentage: number };
      individual_verified: { price: number; discount_percentage: number };
      business: { price: number; discount_percentage: number };
    };
  };
}

export interface ActiveCampaign {
  id: number;
  name: string;
  discountPercentage: number;
  bannerText: string;
  bannerEmoji: string;
  daysRemaining: number;
  promoCode?: string;
}

export type PromotionType = 'featured' | 'urgent' | 'sticky';
export type Duration = 3 | 7 | 15;
export type AccountType = 'individual' | 'individual_verified' | 'business';

interface UsePromotionPricingProps {
  adId: number;
}

export function usePromotionPricing({ adId }: UsePromotionPricingProps) {
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [pricingTier, setPricingTier] = useState<string>('default');
  const [userAccountType, setUserAccountType] = useState<AccountType>('individual');
  const [activeCampaign, setActiveCampaign] = useState<ActiveCampaign | null>(null);

  const fetchPricing = useCallback(async () => {
    try {
      const response = await apiClient.getPromotionPricing({ adId });
      if (response.success && response.data) {
        setPricing(response.data.adPricing || response.data.pricing);
        setPricingTier(response.data.adPricingTier || 'default');
        console.log('📊 [Pricing] Tier for ad:', response.data.adPricingTier || 'default');
      }
    } catch (err: any) {
      console.error('Error fetching pricing:', err);
      throw new Error('Failed to load pricing information');
    }
  }, [adId]);

  const checkUserAccountType = useCallback(async () => {
    try {
      const response = await apiClient.getMe();
      if (response.success && response.data) {
        const user = response.data;
        if (user.accountType === 'business' && user.businessVerificationStatus === 'approved') {
          setUserAccountType('business');
        } else if (user.accountType === 'individual' && (user.individualVerified || user.businessVerificationStatus === 'verified')) {
          setUserAccountType('individual_verified');
        } else {
          setUserAccountType('individual');
        }
      }
    } catch (err) {
      console.error('Error checking user account type:', err);
    }
  }, []);

  const fetchActiveCampaigns = useCallback(async () => {
    try {
      const response = await fetch(`/api/promotional-campaigns/active?tier=${pricingTier}`);
      const data = await response.json();
      if (data.success && data.data?.bestCampaign) {
        setActiveCampaign(data.data.bestCampaign);
      }
    } catch (err) {
      console.error('Error fetching active campaigns:', err);
    }
  }, [pricingTier]);

  const calculatePrice = useCallback(
    (selectedType: PromotionType, selectedDuration: Duration) => {
      if (!pricing || !pricing[selectedType]) {
        return { currentPrice: 0, originalPrice: 0, totalDiscount: 0, savings: 0 };
      }

      const typePrice = pricing[selectedType][selectedDuration];
      if (!typePrice) {
        return { currentPrice: 0, originalPrice: 0, totalDiscount: 0, savings: 0 };
      }

      const originalPrice = typePrice.individual?.price || 0;

      // Calculate ADDITIVE total discount
      let totalDiscountPercent = 0;

      // Account type discount
      if (userAccountType === 'individual_verified') {
        totalDiscountPercent += 20;
      } else if (userAccountType === 'business') {
        totalDiscountPercent += 40;
      }

      // Campaign discount (additive)
      if (activeCampaign && activeCampaign.discountPercentage > 0) {
        totalDiscountPercent += activeCampaign.discountPercentage;
      }

      // Cap at 90%
      totalDiscountPercent = Math.min(totalDiscountPercent, 90);

      const currentPrice = Math.round(originalPrice * (1 - totalDiscountPercent / 100));
      const savings = originalPrice - currentPrice;

      return { currentPrice, originalPrice, totalDiscount: totalDiscountPercent, savings };
    },
    [pricing, userAccountType, activeCampaign]
  );

  const getAccountDiscount = useCallback(() => {
    if (userAccountType === 'individual_verified') return 20;
    if (userAccountType === 'business') return 40;
    return 0;
  }, [userAccountType]);

  const getPriceAfterAccountDiscount = useCallback(
    (originalPrice: number) => {
      const discount = getAccountDiscount();
      return Math.round(originalPrice * (1 - discount / 100));
    },
    [getAccountDiscount]
  );

  return {
    pricing,
    pricingTier,
    userAccountType,
    activeCampaign,
    fetchPricing,
    checkUserAccountType,
    fetchActiveCampaigns,
    calculatePrice,
    getAccountDiscount,
    getPriceAfterAccountDiscount,
    setActiveCampaign,
  };
}

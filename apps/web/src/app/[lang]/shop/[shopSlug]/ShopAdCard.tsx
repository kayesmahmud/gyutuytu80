'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { AdCard } from '@/components/ads';
import PromoteAdModal from '@/components/promotion/PromoteAdModal';

interface ShopAdCardProps {
  shopId: number;
  lang: string;
  ad: {
    id: number;
    title: string;
    price: number;
    primaryImage?: string | null;
    categoryName?: string | null;
    categoryIcon?: string | null;
    publishedAt?: string | Date;
    createdAt?: string | Date;
    sellerName: string;
    isFeatured?: boolean;
    isUrgent?: boolean;
    isSticky?: boolean;
    condition?: string | null;
    slug?: string;
    accountType?: string;
    businessVerificationStatus?: string;
    individualVerified?: boolean;
  };
}

export default function ShopAdCard({ shopId, lang, ad }: ShopAdCardProps) {
  const { user, isAuthenticated } = useUserAuth();
  const router = useRouter();
  const [showPromoteModal, setShowPromoteModal] = useState(false);

  // Check if current user is the shop owner
  const isOwner = isAuthenticated && user?.id === shopId;

  return (
    <div className="relative">
      <AdCard lang={lang} ad={ad} />

      {/* Promote button - only visible to shop owner */}
      {isOwner && (
        <button
          onClick={() => setShowPromoteModal(true)}
          className="w-full mt-2 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 text-white border-none rounded-lg cursor-pointer text-xs font-semibold hover:from-purple-600 hover:via-indigo-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg hover:scale-[1.02]"
          title="Promote this ad"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Promote</span>
        </button>
      )}

      {/* Promote Modal */}
      {showPromoteModal && (
        <PromoteAdModal
          isOpen={showPromoteModal}
          onClose={() => setShowPromoteModal(false)}
          ad={{
            id: ad.id,
            title: ad.title,
            isFeatured: ad.isFeatured,
            isUrgent: ad.isUrgent,
            isSticky: ad.isSticky,
          }}
          onPromote={() => {
            setShowPromoteModal(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

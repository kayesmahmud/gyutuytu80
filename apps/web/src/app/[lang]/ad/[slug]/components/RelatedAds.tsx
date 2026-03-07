import { AdCard } from '@/components/ads';
import { getTranslations } from 'next-intl/server';

export interface RelatedAd {
  id: number;
  title: string;
  price: number;
  primaryImage: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  publishedAt: Date;
  sellerName: string;
  isFeatured: boolean;
  isUrgent: boolean;
  isSticky: boolean;
  condition: string | null;
  slug: string | null;
  accountType: string | null;
  businessVerificationStatus: string | null;
  individualVerified: boolean;
}

interface RelatedAdsProps {
  ads: RelatedAd[];
  lang: string;
}

export async function RelatedAds({ ads, lang }: RelatedAdsProps) {
  if (ads.length === 0) return null;

  const t = await getTranslations('ads');

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">
        {t('relatedAds')}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 md:gap-6">
        {ads.map((ad) => (
          <AdCard
            key={ad.id}
            lang={lang}
            ad={{
              id: ad.id,
              title: ad.title,
              price: ad.price,
              primaryImage: ad.primaryImage,
              categoryName: ad.categoryName,
              categoryIcon: ad.categoryIcon,
              publishedAt: ad.publishedAt,
              sellerName: ad.sellerName,
              isFeatured: ad.isFeatured,
              isUrgent: ad.isUrgent,
              isSticky: ad.isSticky,
              condition: ad.condition,
              slug: ad.slug || undefined,
              accountType: ad.accountType || undefined,
              businessVerificationStatus: ad.businessVerificationStatus || undefined,
              individualVerified: ad.individualVerified,
            }}
          />
        ))}
      </div>
    </div>
  );
}

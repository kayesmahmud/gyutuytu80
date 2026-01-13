'use client';

import Link from 'next/link';
import { getImageUrl } from '@/lib/images/imageUrl';
import { formatPrice, formatDateTime } from '@thulobazaar/utils';

interface FeaturedAd {
  id: number;
  title: string;
  price: number;
  primaryImage: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  locationName: string | null;
  slug?: string;
  condition: string | null;
  publishedAt?: string | Date;
  sellerName?: string;
  accountType?: string;
  businessVerificationStatus?: string;
  individualVerified?: boolean;
}

interface FeaturedAdsCarouselProps {
  ads: FeaturedAd[];
  lang: string;
}

// Max ads to display in grid (5 rows x 4 columns on desktop)
const MAX_FEATURED_ADS = 20;

export default function FeaturedAdsCarousel({ ads, lang }: FeaturedAdsCarouselProps) {
  if (ads.length === 0) return null;

  // Limit to max ads for grid display
  const displayAds = ads.slice(0, MAX_FEATURED_ADS);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      {displayAds.map((ad) => (
        <Link
          key={ad.id}
          href={`/${lang}/ad/${ad.slug || ad.id}`}
          className="block bg-white rounded-xl overflow-hidden border-2 border-yellow-400 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 no-underline group/card relative"
        >
          {/* Featured Badge */}
          <div className="absolute top-1.5 left-1.5 md:top-3 md:left-3 z-10">
            <span className="inline-flex items-center gap-0.5 md:gap-1 px-1.5 py-0.5 md:px-2.5 md:py-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-[10px] md:text-xs font-bold rounded-full shadow-md">
              <svg className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="hidden sm:inline">Featured</span>
            </span>
          </div>

          {/* Image */}
          <div className="relative w-full h-32 sm:h-36 md:h-48 bg-gray-100">
            {/* Condition Badge on Image */}
            {ad.condition && (
              <div className={`absolute bottom-1.5 right-1.5 rounded-full font-semibold z-10 px-2 py-0.5 text-[10px] ${
                ad.condition === 'new'
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
              }`}>
                {ad.condition === 'new' ? 'NEW' : 'USED'}
              </div>
            )}
            {ad.primaryImage ? (
              <img
                src={getImageUrl(ad.primaryImage, 'ads') as string}
                alt={ad.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl md:text-5xl text-gray-600">
                {ad.categoryIcon || '📦'}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-2 md:p-4">
            <h3 className="text-xs md:text-lg font-semibold text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap mb-1 md:mb-2 group-hover/card:text-rose-500 transition-colors">
              {ad.title}
            </h3>

            {/* Category */}
            {ad.categoryName && (
              <div className="flex items-center gap-1 text-[10px] md:text-sm text-gray-500 mb-1 md:mb-2">
                <span className="text-[10px] md:text-sm flex-shrink-0">{ad.categoryIcon || '📁'}</span>
                <span className="truncate">{ad.categoryName}</span>
              </div>
            )}

            {/* Price */}
            <div className="mb-1 md:mb-2">
              <span className="text-sm md:text-xl font-bold text-emerald-500">
                {formatPrice(ad.price)}
              </span>
            </div>

            {/* Time - hidden on mobile for space */}
            {ad.publishedAt && (
              <div className="hidden sm:flex items-center gap-1 text-[10px] md:text-xs text-gray-600 mb-1 md:mb-2">
                <span>🕒</span>
                <span className="truncate">{formatDateTime(ad.publishedAt)}</span>
              </div>
            )}

            {/* Seller */}
            {ad.sellerName && (
              <div className="flex items-center gap-1 text-[10px] md:text-sm text-gray-600 font-medium">
                <span className="truncate">{ad.sellerName}</span>
                {/* Golden Badge for Verified Business */}
                {ad.accountType === 'business' && ad.businessVerificationStatus === 'approved' && (
                  <img
                    src="/golden-badge.png"
                    alt="Verified Business"
                    title="Verified Business"
                    className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0"
                  />
                )}
                {/* Blue Badge for Verified Individual */}
                {ad.accountType === 'individual' && (ad.individualVerified || ad.businessVerificationStatus === 'verified') && (
                  <img
                    src="/blue-badge.png"
                    alt="Verified Individual Seller"
                    title="Verified Individual Seller"
                    className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0"
                  />
                )}
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

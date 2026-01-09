'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@thulobazaar/utils';
import { getImageUrl } from '@/lib/images/imageUrl';

interface FavoriteAd {
  id: number;
  adId: number;
  createdAt: string;
  ad: {
    id: number;
    title: string;
    slug: string;
    price: number | null;
    primaryImage: string | null;
    category: { name: string } | null;
    location: { name: string } | null;
  };
}

interface SavedAdsTabProps {
  favorites: FavoriteAd[];
  loading: boolean;
  lang: string;
  onRemoveFavorite: (adId: number) => void;
}

export function SavedAdsTab({
  favorites,
  loading,
  lang,
  onRemoveFavorite,
}: SavedAdsTabProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved ads yet</h3>
        <p className="text-gray-500 mb-6">Save ads you like by clicking the heart icon</p>
        <Link
          href={`/${lang}/ads`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Browse Ads
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {favorites.map((fav) => (
        <FavoriteAdCard
          key={fav.id}
          favorite={fav}
          lang={lang}
          onRemove={() => onRemoveFavorite(fav.adId)}
        />
      ))}
    </div>
  );
}

interface FavoriteAdCardProps {
  favorite: FavoriteAd;
  lang: string;
  onRemove: () => void;
}

function FavoriteAdCard({ favorite, lang, onRemove }: FavoriteAdCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="flex gap-3 p-3">
        {/* Image - larger and more prominent */}
        <Link
          href={`/${lang}/ad/${favorite.ad.slug}`}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative"
        >
          {favorite.ad.primaryImage ? (
            <Image
              src={getImageUrl(favorite.ad.primaryImage, 'ads') || ''}
              alt={favorite.ad.title}
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 96px, 112px"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <Link
              href={`/${lang}/ad/${favorite.ad.slug}`}
              className="text-gray-900 font-semibold hover:text-primary transition-colors line-clamp-2 text-sm sm:text-base leading-tight"
            >
              {favorite.ad.title}
            </Link>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500 flex-wrap">
              {favorite.ad.category && (
                <span className="bg-gray-100 px-2 py-0.5 rounded-full">{favorite.ad.category.name}</span>
              )}
              {favorite.ad.location && (
                <span className="truncate max-w-[140px]">{favorite.ad.location.name}</span>
              )}
            </div>
          </div>

          {/* Price */}
          {favorite.ad.price ? (
            <div className="text-lg sm:text-xl font-bold text-emerald-600 mt-1">
              {formatPrice(favorite.ad.price)}
            </div>
          ) : (
            <div className="text-sm text-gray-400 mt-1">Price on request</div>
          )}
        </div>
      </div>

      {/* Action buttons - full width row at bottom */}
      <div className="flex border-t border-gray-100">
        <Link
          href={`/${lang}/ad/${favorite.ad.slug}`}
          className="flex-1 py-2.5 text-center text-sm font-medium text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View
        </Link>
        <div className="w-px bg-gray-100" />
        <button
          onClick={onRemove}
          className="flex-1 py-2.5 text-center text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Remove
        </button>
      </div>
    </div>
  );
}

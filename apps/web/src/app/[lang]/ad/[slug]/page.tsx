import { Metadata } from 'next';
import { cache } from 'react';
import { formatPrice, formatRelativeTime } from '@thulobazaar/utils';
import { prisma } from '@thulobazaar/database';
import { notFound } from 'next/navigation';
import AdDetailClient from './AdDetailClient';
import PromoteSection from './PromoteSection';
import { Breadcrumb } from '@/components/ui';
import PromotionSuccessToast from './PromotionSuccessToast';
import AdBanner from '@/components/ads/AdBanner';
import {
  AdBadges,
  SpecificationsSection,
  LocationSection,
  SellerCard,
  SafetyTips,
  RelatedAds,
  AdContactBar,
} from './components';
import { getImageUrl } from '@/lib/images/imageUrl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

interface AdDetailPageProps {
  params: Promise<{ lang: string; slug: string }>;
  searchParams?: Promise<{ promoted?: string; txnId?: string }>;
}

// Get related ads from same category (excluding current ad)
const getRelatedAds = cache(async (categoryId: number | null, currentAdId: number, limit = 3) => {
  if (!categoryId) return [];

  return prisma.ads.findMany({
    where: {
      category_id: categoryId,
      id: { not: currentAdId },
      status: 'approved',
      deleted_at: null,
      users_ads_user_idTousers: {
        is_active: true,
      },
    },
    include: {
      ad_images: {
        where: { is_primary: true },
        take: 1,
        select: {
          file_path: true,
        },
      },
      categories: {
        select: {
          name: true,
          icon: true,
        },
      },
      users_ads_user_idTousers: {
        select: {
          full_name: true,
          business_name: true,
          account_type: true,
          business_verification_status: true,
          individual_verified: true,
        },
      },
    },
    orderBy: {
      reviewed_at: { sort: 'desc', nulls: 'last' },
    },
    take: limit,
  });
});

const getAdBySlug = cache(async (slug: string) => {
  return prisma.ads.findFirst({
    where: {
      slug,
      deleted_at: null,
    },
    include: {
      ad_images: {
        orderBy: [{ is_primary: 'desc' }, { id: 'asc' }],
        select: {
          id: true,
          filename: true,
          file_path: true,
          is_primary: true,
        },
      },
      categories: {
        select: {
          id: true,
          name: true,
          name_ne: true,
          slug: true,
          icon: true,
          categories: {
            select: {
              id: true,
              name: true,
              name_ne: true,
              slug: true,
              icon: true,
            },
          },
        },
      },
      locations: {
        select: {
          id: true,
          name: true,
          name_ne: true,
          type: true,
          locations: {
            select: {
              id: true,
              name: true,
              name_ne: true,
              type: true,
              locations: {
                select: {
                  id: true,
                  name: true,
                  name_ne: true,
                  type: true,
                  locations: {
                    select: {
                      id: true,
                      name: true,
                      name_ne: true,
                      type: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      users_ads_user_idTousers: {
        select: {
          id: true,
          email: true,
          full_name: true,
          phone: true,
          business_phone: true,
          avatar: true,
          shop_slug: true,
          account_type: true,
          business_name: true,
          individual_verified: true,
          business_verification_status: true,
          created_at: true,
        },
      },
    },
  });
});

export async function generateMetadata({ params }: AdDetailPageProps): Promise<Metadata> {
  const { slug, lang } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com';

  try {
    const ad = await getAdBySlug(slug);

    if (ad) {
      const imagePath = ad.ad_images?.[0]?.file_path;
      const imageUrl = imagePath
        ? getImageUrl(imagePath, 'ads') || `${baseUrl}/placeholder-ad.png`
        : `${baseUrl}/placeholder-ad.png`;

      const t = await getTranslations({ locale: lang, namespace: 'metadata' });
      const description = ad.description?.substring(0, 160) || t('viewDetailsFor', { title: ad.title });
      const priceText = ad.price ? `Rs. ${parseFloat(ad.price.toString()).toLocaleString()}` : t('priceOnRequest');

      return {
        title: `${ad.title} | ${priceText} - Thulo Bazaar`,
        description,
        openGraph: {
          title: ad.title,
          description,
          url: `${baseUrl}/${lang}/ad/${slug}`,
          siteName: 'Thulo Bazaar',
          images: [{ url: imageUrl, width: 800, height: 600, alt: ad.title }],
          locale: lang === 'en' ? 'en_US' : 'ne_NP',
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: ad.title,
          description,
          images: [imageUrl],
        },
      };
    }
  } catch (error) {
    console.error('Error fetching ad metadata:', error);
  }

  const t = await getTranslations({ locale: lang, namespace: 'metadata' });
  const title = slug.replace(/-/g, ' ');
  return {
    title: `${title} - Thulo Bazaar`,
    description: t('adFallbackDescription', { title }),
  };
}

// Helper functions for building location and category strings
function buildFullLocation(locations: any, lang: string): string {
  const locationParts: string[] = [];
  const loc = (item: any) => lang === 'ne' && item?.name_ne ? item.name_ne : item?.name;
  if (locations?.name) locationParts.push(loc(locations));
  if (locations?.locations?.name) locationParts.push(loc(locations.locations));
  if (locations?.locations?.locations?.name) locationParts.push(loc(locations.locations.locations));
  if (locations?.locations?.locations?.locations?.name) locationParts.push(loc(locations.locations.locations.locations));
  return locationParts.join(', ');
}

function buildFullCategory(categories: any, lang: string): string {
  const categoryParts: string[] = [];
  const loc = (item: any) => lang === 'ne' && item?.name_ne ? item.name_ne : item?.name;
  if (categories?.categories?.name) categoryParts.push(loc(categories.categories));
  if (categories?.name) categoryParts.push(loc(categories));
  return categoryParts.join(' > ');
}

export default async function AdDetailPage({ params, searchParams }: AdDetailPageProps) {
  const { lang, slug } = await params;
  setRequestLocale(lang);
  const t = await getTranslations('ads');
  const tc = await getTranslations('common');
  const search = (await searchParams) || {};

  const ad = await getAdBySlug(slug);
  if (!ad) {
    notFound();
  }

  // Increment view count (fire and forget)
  prisma.ads.update({
    where: { id: ad.id },
    data: { view_count: { increment: 1 } },
  }).catch(console.error);

  // Get favorites count for this ad
  const favoritesCount = await prisma.user_favorites.count({
    where: { ad_id: ad.id },
  });

  // Fetch related ads from same category
  const relatedAdsRaw = await getRelatedAds(ad.category_id, ad.id);
  const relatedAds = relatedAdsRaw.map((relAd: any) => ({
    id: relAd.id,
    title: relAd.title,
    price: relAd.price ? parseFloat(relAd.price.toString()) : 0,
    primaryImage: relAd.ad_images?.[0]?.file_path || null,
    categoryName: relAd.categories?.name || null,
    categoryIcon: relAd.categories?.icon || null,
    publishedAt: relAd.reviewed_at || relAd.created_at || new Date(),
    sellerName: relAd.users_ads_user_idTousers?.business_name || relAd.users_ads_user_idTousers?.full_name || tc('unknownSeller'),
    isFeatured: relAd.is_featured || false,
    isUrgent: relAd.is_urgent || false,
    isSticky: relAd.is_sticky || false,
    condition: relAd.condition || null,
    slug: relAd.slug,
    accountType: relAd.users_ads_user_idTousers?.account_type || null,
    businessVerificationStatus: relAd.users_ads_user_idTousers?.business_verification_status || null,
    individualVerified: relAd.users_ads_user_idTousers?.individual_verified || false,
  }));

  const fullLocation = buildFullLocation(ad.locations, lang);
  const fullCategory = buildFullCategory(ad.categories, lang);
  const images = ad.ad_images.map((img: any) =>
    getImageUrl(img.file_path, 'ads') || ''
  );
  const customFields = ad.custom_fields as Record<string, any> | null;

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: tc('home'), path: `/${lang}` },
    { label: t('allAds'), path: `/${lang}/ads` },
  ];
  if (ad.categories?.name && ad.categories?.slug) {
    breadcrumbItems.push({
      label: lang === 'ne' && ad.categories.name_ne ? ad.categories.name_ne : ad.categories.name,
      path: `/${lang}/ads/${ad.categories.slug}`
    });
  }
  breadcrumbItems.push({
    label: ad.title.substring(0, 40) + (ad.title.length > 40 ? '...' : ''),
    path: ''
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb items={breadcrumbItems} />
      <PromotionSuccessToast promoted={search.promoted === 'true'} txnId={search.txnId} />

      <div className="max-w-[1440px] mx-auto px-4 py-4 md:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[160px_1fr_350px_160px] gap-4 md:gap-6">
          {/* Left Vertical Banner */}
          <div className="hidden xl:flex xl:flex-col xl:items-center self-start" style={{ marginTop: '200px' }}>
            <div className="sticky top-4">
              <AdBanner slot="adDetailLeft" size="skyscraper" />
            </div>
          </div>

          {/* Main Content */}
          <div>
            {/* Top Banners */}
            <div className="flex sm:hidden justify-center mb-6">
              <AdBanner slot="adDetailTopMobile" size="mobileBanner" />
            </div>
            <div className="hidden sm:flex justify-center mb-6">
              <AdBanner slot="adDetailTop" size="leaderboard" />
            </div>

            {/* Image Gallery */}
            <AdDetailClient images={images} lang={lang} />

            {/* Ad Details */}
            <div className="bg-white rounded-xl p-4 sm:p-6 md:p-8 mb-4 md:mb-6 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2">{ad.title}</h1>
                  <div className="flex gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 flex-wrap">
                    {/* Show when ad was approved (reviewed_at), not when submitted */}
                    <span>{formatRelativeTime(ad.reviewed_at || ad.created_at || new Date())}</span>
                    <span>•</span>
                    <span>{ad.view_count || 0} {t('views')}</span>
                  </div>
                </div>
              </div>

              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-600 mb-4">
                {ad.price ? formatPrice(parseFloat(ad.price.toString())) : t('priceOnRequest')}
              </div>

              <AdBadges
                condition={ad.condition}
                isNegotiable={customFields?.isNegotiable || false}
                fullCategory={fullCategory}
                isFeatured={ad.is_featured ?? false}
                featuredUntil={ad.featured_until}
                isUrgent={ad.is_urgent ?? false}
                urgentUntil={ad.urgent_until}
                isSticky={ad.is_sticky ?? false}
                stickyUntil={ad.sticky_until}
              />

              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">{t('description')}</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{ad.description}</p>
              </div>

              <SpecificationsSection customFields={customFields} lang={lang} />
              <LocationSection fullLocation={fullLocation} locationType={ad.locations?.type || null} />
            </div>

            {/* Seller Card + Promote - Mobile only, shown after ad details */}
            <div className="lg:hidden mt-4 space-y-4">
              <SellerCard
                seller={ad.users_ads_user_idTousers}
                adId={ad.id}
                userId={ad.user_id}
                adTitle={ad.title}
                adSlug={slug}
                lang={lang}
                favoritesCount={favoritesCount}
              />
              <PromoteSection ad={{
                id: ad.id,
                title: ad.title,
                user_id: ad.user_id || 0,
                is_featured: ad.is_featured ?? false,
                featured_until: ad.featured_until,
                is_urgent: ad.is_urgent ?? false,
                urgent_until: ad.urgent_until,
                is_sticky: ad.is_sticky ?? false,
                sticky_until: ad.sticky_until
              }} />
            </div>

            {/* Related Ads */}
            {relatedAds.length > 0 && (
              <div className="mt-8">
                <RelatedAds ads={relatedAds} lang={lang} />
              </div>
            )}

            {/* Bottom Banner */}
            <div className="flex justify-center mt-8">
              <AdBanner slot="adDetailBottom" size="largeRectangle" />
            </div>
          </div>

          {/* Sidebar - Desktop only for SellerCard & Promote (shown inline on mobile) */}
          <div>
            <div className="hidden lg:block">
              <SellerCard
                seller={ad.users_ads_user_idTousers}
                adId={ad.id}
                userId={ad.user_id}
                adTitle={ad.title}
                adSlug={slug}
                lang={lang}
                favoritesCount={favoritesCount}
              />
            </div>

            <div className="hidden lg:block">
              <PromoteSection ad={{
                id: ad.id,
                title: ad.title,
                user_id: ad.user_id || 0,
                is_featured: ad.is_featured ?? false,
                featured_until: ad.featured_until,
                is_urgent: ad.is_urgent ?? false,
                urgent_until: ad.urgent_until,
                is_sticky: ad.is_sticky ?? false,
                sticky_until: ad.sticky_until
              }} />
            </div>

            <SafetyTips />
          </div>

          {/* Right Vertical Banner */}
          <div className="hidden xl:flex xl:flex-col xl:items-center self-start" style={{ marginTop: '200px' }}>
            <div className="sticky top-4">
              <AdBanner slot="adDetailRight" size="skyscraper" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Contact Action Bar */}
      <AdContactBar
        sellerId={ad.user_id || 0}
        sellerPhone={ad.users_ads_user_idTousers?.phone || null}
        sellerBusinessPhone={ad.users_ads_user_idTousers?.business_phone || null}
        adId={ad.id}
        adTitle={ad.title}
        adSlug={slug}
        lang={lang}
      />
    </div>
  );
}

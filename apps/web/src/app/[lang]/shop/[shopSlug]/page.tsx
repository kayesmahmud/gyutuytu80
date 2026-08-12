import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@thulobazaar/database';
import Link from 'next/link';
import ShopProfileClient from './ShopProfileClient';
import ShopSidebar from './ShopSidebar';
import ShopEmptyState from './ShopEmptyState';
import ReportShopButton from './ReportShopButton';
import ShopAdCard from './ShopAdCard';
import { getShopProfile, buildShopMetadata, getCanonicalShopSlug, shopHasApprovedAds } from '@/lib/shops';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ShopJsonLd } from '@/components/seo/ShopJsonLd';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
import { ensureHttps, buildSocialUrl, extractSocialUsername } from '@/utils/socialMedia';
import { getImageUrl } from '@/lib/images/imageUrl';

interface ShopProfilePageProps {
  params: Promise<{ lang: string; shopSlug: string }>;
}

export async function generateMetadata({ params }: ShopProfilePageProps): Promise<Metadata> {
  const { lang, shopSlug } = await params;

  try {
    const shop = await getShopProfile(shopSlug);
    if (shop) {
      const hasAds = await shopHasApprovedAds(shop.id);
      return buildShopMetadata(shop, lang, { hasAds });
    }
  } catch (error) {
    console.error('Error fetching shop metadata:', error);
  }

  const t = await getTranslations({ locale: lang, namespace: 'metadata' });
  return {
    title: t('shopFallbackTitle'),
    description: t('shopFallbackDescription'),
    // Without this the not-found shell is indexable and inherits the homepage
    // canonical from the root layout.
    robots: { index: false, follow: true },
  };
}

export default async function ShopProfilePage({ params }: ShopProfilePageProps) {
  const { lang, shopSlug } = await params;
  setRequestLocale(lang);
  const tc = await getTranslations('common');
  const ts = await getTranslations('shop');

  const shop = await getShopProfile(shopSlug);
  if (!shop) {
    notFound();
  }

  // Fetch all approved ads from this shop
  const ads = await prisma.ads.findMany({
    where: {
      user_id: shop.id,
      status: 'approved',
      deleted_at: null,
    },
    include: {
      ad_images: {
        where: { is_primary: true },
        take: 1,
        select: {
          id: true,
          filename: true,
          file_path: true,
        },
      },
      categories: {
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
        },
      },
    },
    orderBy: [
      // Promotions first (Urgent > Sticky), then newest-approved. Featured is a
      // homepage-only signal and is intentionally not pinned in listings.
      { is_urgent: 'desc' },
      { is_sticky: 'desc' },
      { reviewed_at: { sort: 'desc', nulls: 'last' } }, // approval time, nulls last
    ],
  });

  // Calculate stats
  const stats = {
    totalAds: ads.length,
    totalViews: ads.reduce((sum, ad) => sum + (ad.view_count || 0), 0),
    featuredAds: ads.filter(ad => ad.is_featured).length,
  };

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';
  // Structured data must point at the same URL as the canonical, not at whichever
  // slug variant the visitor happened to arrive on.
  const canonicalSlug = getCanonicalShopSlug(shop) || shopSlug;
  const shopUrl = `${baseUrl}/${lang}/shop/${canonicalSlug}`;

  // The seller's own profiles — sameAs is how Google ties this shop to its
  // off-site presence. Older rows stored a bare username instead of a URL, so
  // round-trip each one through extract/build to guarantee an absolute URL.
  const socialProfiles = [
    shop.facebookUrl && buildSocialUrl(extractSocialUsername(shop.facebookUrl, 'facebook'), 'facebook'),
    shop.instagramUrl && buildSocialUrl(extractSocialUsername(shop.instagramUrl, 'instagram'), 'instagram'),
    shop.tiktokUrl && buildSocialUrl(extractSocialUsername(shop.tiktokUrl, 'tiktok'), 'tiktok'),
    shop.businessWebsite && ensureHttps(shop.businessWebsite),
  ].filter((url): url is string => Boolean(url));

  return (
    <div className="min-h-screen bg-gray-50">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: `${baseUrl}/${lang}` },
          { name: 'Shops', url: `${baseUrl}/${lang}/shops` },
          { name: shop.businessName || shop.fullName, url: shopUrl },
        ]}
      />
      <ShopJsonLd
        name={shop.businessName || shop.fullName}
        description={shop.businessDescription || shop.bio || `Shop profile for ${shop.businessName || shop.fullName}`}
        url={shopUrl}
        image={getImageUrl(shop.avatar, 'avatars') || undefined}
        location={shop.locationFullPath || shop.location?.name || undefined}
        sameAs={socialProfiles}
        telephone={shop.businessPhone || shop.phone || undefined}
        numberOfItems={stats.totalAds}
      />
      {/* Breadcrumb - Hidden visually but kept for SEO */}
      <nav aria-label="Breadcrumb" className="sr-only">
        <ol itemScope itemType="https://schema.org/BreadcrumbList">
          <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <Link href={`/${lang}`} itemProp="item">
              <span itemProp="name">{tc('home')}</span>
            </Link>
            <meta itemProp="position" content="1" />
          </li>
          <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <span itemProp="name">{shop.businessName || shop.fullName}</span>
            <meta itemProp="position" content="2" />
          </li>
        </ol>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {/* Cover Photo & Avatar - Rendered by Client Component */}
        <ShopProfileClient
          shopId={shop.id}
          shopSlug={shopSlug}
          lang={lang}
          initialAvatar={shop.avatar}
          initialCover={shop.coverPhoto}
          shopName={shop.businessName || shop.fullName}
          businessVerificationStatus={shop.businessVerificationStatus}
          individualVerified={shop.individualVerified}
          accountType={shop.accountType}
          stats={{
            total_ads: stats.totalAds,
            total_views: stats.totalViews,
            member_since: new Date(shop.createdAt || '').toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            }),
          }}
        />

        {/* Main Content: Sidebar + Ads Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] xl:grid-cols-[350px_1fr] gap-4 sm:gap-6 lg:gap-8">
          {/* Left Sidebar - About, Contact & Location */}
          <ShopSidebar
            shopId={shop.id}
            shopSlug={shopSlug}
            shopName={shop.businessName || shop.fullName}
            lang={lang}
            bio={shop.bio}
            businessDescription={shop.businessDescription}
            businessPhone={shop.businessPhone}
            phone={shop.phone}
            phoneVerified={shop.phoneVerified}
            businessWebsite={shop.businessWebsite}
            googleMapsLink={shop.googleMapsLink}
            facebookUrl={shop.facebookUrl}
            instagramUrl={shop.instagramUrl}
            tiktokUrl={shop.tiktokUrl}
            locationName={shop.location?.name ?? ''}
            locationSlug={shop.location?.slug ?? ''}
            locationFullPath={shop.locationFullPath ?? ''}
            categoryId={shop.defaultCategory?.id ?? null}
            categoryName={shop.defaultCategory?.name ?? null}
            categorySlug={shop.defaultCategory?.slug ?? null}
            categoryIcon={shop.defaultCategory?.icon ?? null}
            subcategoryId={shop.defaultSubcategory?.id ?? null}
            subcategoryName={shop.defaultSubcategory?.name ?? null}
            subcategorySlug={shop.defaultSubcategory?.slug ?? null}
            subcategoryIcon={shop.defaultSubcategory?.icon ?? null}
          />

          {/* Right Side - Ads Grid */}
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-4 sm:mb-5 md:mb-6">
              {ts('adsFrom', { shopName: shop.businessName || shop.fullName, count: stats.totalAds })}
            </h2>

            {ads.length === 0 ? (
              <div className="card text-center py-16">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-gray-600 mb-6">{ts('noActiveAds')}</p>
                {/* POST FREE AD button - ShopEmptyState handles owner check on client side */}
                <ShopEmptyState shopId={shop.id} lang={lang} />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 md:gap-6">
                {ads.map((ad) => (
                  <ShopAdCard
                    key={ad.id}
                    shopId={shop.id}
                    lang={lang}
                    ad={{
                      id: ad.id,
                      title: ad.title,
                      price: ad.price ? parseFloat(ad.price.toString()) : 0,
                      primaryImage: ad.ad_images && ad.ad_images.length > 0
                        ? ad.ad_images[0]?.file_path || null
                        : null,
                      categoryName: ad.categories?.name || null,
                      categoryIcon: ad.categories?.icon || null,
                      // publishedAt = when editor approved (use this for "time ago" display)
                      publishedAt: ad.reviewed_at || ad.created_at || new Date(),
                      createdAt: ad.created_at || new Date(),
                      sellerName: shop.businessName || shop.fullName,
                      isFeatured: ad.is_featured || false,
                      isUrgent: ad.is_urgent || false,
                      isSticky: ad.is_sticky || false,
                      featuredUntil: ad.featured_until || null,
                      urgentUntil: ad.urgent_until || null,
                      stickyUntil: ad.sticky_until || null,
                      condition: ad.condition || null,
                      slug: ad.slug || undefined,
                      accountType: shop.accountType || undefined,
                      businessVerificationStatus: shop.businessVerificationStatus || undefined,
                      individualVerified: shop.individualVerified || false,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Report Shop Button - Mobile only, after products */}
            <div className="lg:hidden flex justify-end mt-6">
              <ReportShopButton
                shopId={shop.id}
                shopName={shop.businessName || shop.fullName}
                lang={lang}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Google Ads dynamic remarketing feed (CSV, "Custom" vertical).
 *
 * Upload in Google Ads → Tools → Shared Library → Business data →
 * Dynamic display ad feed → Custom, or point a scheduled fetch at this URL.
 *
 * NOT Merchant Center: that is built for retail and requires purchasable
 * products with a checkout, which a classifieds site has no way to satisfy.
 * The Custom vertical exists for exactly this case and has no such requirement.
 *
 * Column names below are Google's exact required spellings — they are matched
 * literally, so "Item title" cannot be renamed to "title".
 *
 * The `ID` column must equal the numeric ads.id sent as `ecomm_prodid` by
 * lib/analytics/gtm.ts, or Google will never match a visitor to a listing.
 */

import { prisma } from '@thulobazaar/database';

import {
  absoluteImageUrl,
  adUrl,
  availabilityFor,
  csvCell,
  FEED_AD_SELECT,
  FEED_CURRENCY,
  type FeedAd,
} from '@/lib/feeds/shared';

export const dynamic = 'force-dynamic';

const ANDROID_PACKAGE = 'com.thulobazaar.mobile';
const IOS_APP_ID = '6774762315';
const SITE_HOST = 'thulobazaar.com.np';

/**
 * Deep links so a dynamic ad opens the listing inside the app when installed,
 * instead of dropping the user on a web page or the app's home screen. The
 * app already declares matching App Links / Universal Links for /{lang}/ad/*.
 */
function androidAppLink(slug: string): string {
  return `android-app://${ANDROID_PACKAGE}/https/${SITE_HOST}/en/ad/${slug}`;
}

function iosAppLink(slug: string): string {
  return `ios-app://${IOS_APP_ID}/https/${SITE_HOST}/en/ad/${slug}`;
}

/** Category + location + title terms give Google context to match intent. */
function contextualKeywords(ad: FeedAd): string {
  const terms = [
    ad.categories?.name,
    ad.locations?.name,
    ...ad.title.split(/\s+/).slice(0, 4),
  ].filter((term): term is string => Boolean(term && term.length > 2));

  return Array.from(new Set(terms)).join(';');
}

const COLUMNS = [
  'ID',
  'Item title',
  'Item description',
  'Item category',
  'Price',
  'Image URL',
  'Item address',
  'Final URL',
  'Android app link',
  'iOS app link',
  'Contextual keywords',
] as const;

export async function GET() {
  const ads = (await prisma.ads.findMany({
    where: { status: 'approved', deleted_at: null },
    select: FEED_AD_SELECT,
    orderBy: { updated_at: 'desc' },
    take: 50000,
  })) as FeedAd[];

  const rows: string[] = [COLUMNS.join(',')];

  for (const ad of ads) {
    // The Custom vertical has no availability column, so anything not clearly
    // active is omitted rather than flagged — Google would otherwise keep
    // serving it with no way to express that it is gone.
    if (availabilityFor(ad) !== 'in stock') continue;

    const primaryImage = ad.ad_images[0]?.file_path;
    if (!primaryImage) continue;

    const price = ad.price === null ? null : Number(ad.price);
    if (price === null || Number.isNaN(price)) continue;

    rows.push(
      [
        csvCell(ad.id),
        csvCell(ad.title),
        csvCell(ad.description?.slice(0, 2000) || ad.title),
        csvCell(ad.categories?.name || 'Classifieds'),
        csvCell(`${price.toFixed(2)} ${FEED_CURRENCY}`),
        csvCell(absoluteImageUrl(primaryImage)),
        csvCell(ad.locations?.name || 'Nepal'),
        csvCell(adUrl(ad.slug)),
        csvCell(androidAppLink(ad.slug)),
        csvCell(iosAppLink(ad.slug)),
        csvCell(contextualKeywords(ad)),
      ].join(',')
    );
  }

  return new Response(rows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

/**
 * Meta catalog feed (CSV) for Advantage+ Catalog Ads / dynamic remarketing.
 *
 * Point Meta at this URL in Commerce Manager → Catalog → Data Sources →
 * Scheduled Feed, and set it to fetch hourly. Classifieds inventory turns over
 * far faster than retail: a listing sold this morning must stop being
 * advertised today, or you pay for clicks that land on a dead page.
 *
 * The `id` column MUST be the numeric ads.id, because that is what the pixel
 * sends as `content_ids` (lib/analytics/index.ts) and what the dataLayer sends
 * as `ecomm_prodid`. If these three disagree, Meta reports a healthy catalog
 * and a healthy pixel while serving nothing at all.
 *
 * The inclusion policy lives in lib/feeds/shared.ts, shared with the Google feed.
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

// Inventory changes constantly — never cache this at the edge.
export const dynamic = 'force-dynamic';

/** Meta accepts only these three values. Our DB stores free-ish text. */
function metaCondition(condition: string | null): string {
  switch (condition?.toLowerCase()) {
    case 'brand new':
      return 'new';
    case 'like new':
    case 'refurbished':
      return 'refurbished';
    default:
      return 'used';
  }
}

const COLUMNS = [
  'id',
  'title',
  'description',
  'availability',
  'condition',
  'price',
  'link',
  'image_link',
  'brand',
  'product_type',
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
    const availability = availabilityFor(ad);
    // Meta rejects rows with no image, so skip rather than send a broken row.
    const primaryImage = ad.ad_images[0]?.file_path;
    if (!availability || !primaryImage) continue;

    const price = ad.price === null ? null : Number(ad.price);
    if (price === null || Number.isNaN(price)) continue;

    // A row with a blank image_link is rejected on ingest — skip instead.
    const imageUrl = absoluteImageUrl(primaryImage);
    if (!imageUrl) continue;

    rows.push(
      [
        csvCell(ad.id),
        csvCell(ad.title),
        csvCell(ad.description?.slice(0, 5000) || ad.title),
        csvCell(availability),
        csvCell(metaCondition(ad.condition)),
        csvCell(`${price.toFixed(2)} ${FEED_CURRENCY}`),
        csvCell(adUrl(ad.slug)),
        csvCell(imageUrl),
        csvCell('Thulo Bazaar'),
        csvCell(ad.categories?.name || 'Classifieds'),
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

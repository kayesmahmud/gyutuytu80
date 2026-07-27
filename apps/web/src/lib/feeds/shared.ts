/**
 * Shared logic for the product feeds (Meta catalog + Google dynamic remarketing).
 *
 * SERVER ONLY — imported by route handlers under app/feeds/.
 *
 * Both platforms advertise the same inventory, so the inclusion policy lives
 * here in ONE place. Changing `availabilityFor` changes both feeds at once;
 * letting them drift would mean Meta and Google retargeting different sets of
 * listings, which is impossible to debug from the ad platforms' reporting.
 */

export const FEED_BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';

export const FEED_CURRENCY = 'NPR';

/** Matches the select in both feed routes. */
export interface FeedAd {
  id: number;
  title: string;
  description: string | null;
  price: unknown;
  condition: string | null;
  slug: string;
  expires_at: Date | null;
  categories: { name: string } | null;
  locations: { name: string } | null;
  ad_images: { file_path: string }[];
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TODO(you): the availability policy for this marketplace.
 *
 * Return `null` to leave the ad out of both feeds, or an availability string
 * ('in stock' | 'out of stock') to include it.
 *
 * This is a judgement call about Nepali buyer behaviour, and it decides how the
 * retargeting budget gets spent:
 *
 *   - Excluding sold/expired ads   → never wastes spend, never shows a dead
 *                                    listing, but a visitor whose item sold
 *                                    drops out of retargeting completely.
 *   - Marking them 'out of stock'  → the platforms keep them in the catalog and
 *                                    can show a substitute from the same
 *                                    category; keeps the visitor in the funnel,
 *                                    but risks advertising a gone item.
 *
 * Available to branch on: `ad.expires_at`. Both queries already filter to
 * status 'approved' with `deleted_at: null`.
 *
 * Current default: drop expired ads. Nepali buyers contact sellers directly, so
 * a dead listing costs someone a wasted phone call rather than a soft bounce.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function availabilityFor(ad: FeedAd): string | null {
  const isExpired = ad.expires_at !== null && ad.expires_at < new Date();
  return isExpired ? null : 'in stock';
}

/** RFC 4180: wrap every field, double any embedded quote, flatten newlines. */
export function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/\r?\n/g, ' ').replace(/"/g, '""')}"`;
}

export function absoluteImageUrl(filePath: string): string {
  if (/^https?:\/\//i.test(filePath)) return filePath;
  const clean = filePath.replace(/^\/+/, '');
  const withPrefix = clean.startsWith('uploads/') ? clean : `uploads/ads/${clean}`;
  return `${FEED_BASE_URL}/${withPrefix}`;
}

export function adUrl(slug: string): string {
  return `${FEED_BASE_URL}/en/ad/${slug}`;
}

/** The select shared by both feed routes. */
export const FEED_AD_SELECT = {
  id: true,
  title: true,
  description: true,
  price: true,
  condition: true,
  slug: true,
  expires_at: true,
  categories: { select: { name: true } },
  locations: { select: { name: true } },
  ad_images: {
    select: { file_path: true },
    orderBy: { is_primary: 'desc' },
    take: 1,
  },
} as const;

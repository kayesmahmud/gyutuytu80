/**
 * Meta Pixel standard/custom event helpers.
 *
 * The base pixel + automatic PageView tracking lives in components/MetaPixel.tsx.
 * These helpers fire the conversion events that matter for a classifieds
 * marketplace: signups and ad postings are the primary goals; ViewContent,
 * Search and Lead build the audiences and intent signals around them.
 *
 * All calls are safe no-ops if fbq hasn't loaded yet (e.g. ad blockers).
 */

const CURRENCY = 'NPR';

function fbqTrack(event: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  window.fbq?.('track', event, params);
}

function fbqTrackCustom(event: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  window.fbq?.('trackCustom', event, params);
}

/** Someone opened an ad's detail page. */
export function trackViewContent(ad: {
  id: number | string;
  title: string;
  price?: number | null;
  category?: string | null;
}): void {
  fbqTrack('ViewContent', {
    content_type: 'product',
    content_ids: [String(ad.id)],
    content_name: ad.title,
    content_category: ad.category ?? undefined,
    value: ad.price ?? undefined,
    currency: CURRENCY,
  });
}

/** Someone ran a search / browsed listings with a query. */
export function trackSearch(searchString: string): void {
  if (!searchString.trim()) return;
  fbqTrack('Search', { search_string: searchString.trim() });
}

/**
 * Someone contacted a seller (revealed phone OR started a message).
 * For a marketplace, any seller contact is the buyer-side conversion.
 */
export function trackLead(params?: {
  adId?: number | string;
  adTitle?: string;
  method?: 'phone' | 'message';
}): void {
  fbqTrack('Lead', {
    content_ids: params?.adId ? [String(params.adId)] : undefined,
    content_name: params?.adTitle,
    contact_method: params?.method,
    currency: CURRENCY,
  });
}

/** A new user finished signing up. Primary acquisition goal. */
export function trackCompleteRegistration(method?: string): void {
  fbqTrack('CompleteRegistration', {
    status: true,
    content_name: method,
  });
}

/**
 * A seller successfully posted an ad. Primary supply-side goal.
 * Custom event (no standard Meta event fits "listed an item"): create a
 * Custom Conversion from "PostAd" in Events Manager to optimize ads toward it.
 */
export function trackPostAd(ad?: {
  id?: number | string;
  title?: string;
  category?: string | null;
  price?: number | null;
}): void {
  fbqTrackCustom('PostAd', {
    content_ids: ad?.id ? [String(ad.id)] : undefined,
    content_name: ad?.title,
    content_category: ad?.category ?? undefined,
    value: ad?.price ?? undefined,
    currency: CURRENCY,
  });
}

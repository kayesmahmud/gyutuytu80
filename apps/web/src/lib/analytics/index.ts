/**
 * Unified analytics layer.
 *
 * One call site fans out to both transports so Meta and Google can never drift
 * apart:
 *   - Meta Pixel  (lib/metaPixel.ts)  → fbq
 *   - Google Tag Manager (./gtm.ts)   → dataLayer → Ads conversion + remarketing
 *
 * Import these instead of the transport modules directly.
 *
 * CRITICAL: `ad.id` is the numeric ads.id, NOT the slug. It is the join key
 * between the pixel, the dataLayer and the product feed — dynamic remarketing
 * silently serves nothing if the three disagree. Public URLs use ad.slug; the
 * feed carries both (`id` = numeric, `link` = slug URL).
 */

import * as meta from '../metaPixel';

import { pushEcommEvent, pushEvent, type EcommPageType } from './gtm';

export type { EcommPageType };

export interface TrackedAd {
  id: number | string;
  title: string;
  price?: number | null;
  category?: string | null;
}

/** Someone opened an ad's detail page. Feeds dynamic remarketing. */
export function trackViewContent(ad: TrackedAd): void {
  meta.trackViewContent(ad);

  pushEcommEvent(
    'view_item',
    {
      ecomm_prodid: String(ad.id),
      ecomm_pagetype: 'product',
      ecomm_totalvalue: ad.price ?? undefined,
    },
    {
      items: [
        {
          item_id: String(ad.id),
          item_name: ad.title,
          item_category: ad.category ?? undefined,
          price: ad.price ?? undefined,
        },
      ],
      currency: 'NPR',
    }
  );
}

/** Someone ran a search or browsed listings with a query. */
export function trackSearch(searchString: string): void {
  const query = searchString.trim();
  if (!query) return;

  meta.trackSearch(query);
  pushEcommEvent('search', { ecomm_pagetype: 'searchresults' }, {
    search_term: query,
  });
}

/**
 * Someone contacted a seller (revealed phone OR started a message).
 * For a classifieds marketplace this is the buyer-side conversion — there is
 * no checkout, so seller contact is as far as the funnel goes on-platform.
 */
export function trackLead(params?: {
  adId?: number | string;
  adTitle?: string;
  method?: 'phone' | 'message';
}): void {
  meta.trackLead(params);

  pushEvent('generate_lead', {
    ad_id: params?.adId ? String(params.adId) : undefined,
    ad_title: params?.adTitle,
    contact_method: params?.method,
    currency: 'NPR',
  });
}

/** A new user finished signing up. Primary acquisition goal. */
export function trackCompleteRegistration(method?: string): void {
  meta.trackCompleteRegistration(method);
  pushEvent('sign_up', { method });
}

/** A seller successfully posted an ad. Primary supply-side goal. */
export function trackPostAd(ad?: Partial<TrackedAd>): void {
  meta.trackPostAd(ad);

  pushEvent('post_ad', {
    ad_id: ad?.id ? String(ad.id) : undefined,
    ad_title: ad?.title,
    item_category: ad?.category ?? undefined,
    value: ad?.price ?? undefined,
    currency: 'NPR',
  });
}

/**
 * Route change page view. Meta's PageView is fired by MetaPixel.tsx, so this
 * only reports to GTM — but it must still run on every navigation so the
 * remarketing tag sees a pagetype for non-ad pages.
 */
export function trackPageView(pageType: EcommPageType = 'other'): void {
  pushEcommEvent('page_view', { ecomm_pagetype: pageType });
}

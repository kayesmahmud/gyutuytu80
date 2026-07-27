/**
 * Google Tag Manager dataLayer transport.
 *
 * The container (GTM-NDZQCRKC) is loaded in app/layout.tsx but holds no tags
 * yet — tags configured in the GTM UI trigger off the custom events pushed
 * here, so the event names below must match the trigger names set up there.
 *
 * Google Ads dynamic remarketing additionally needs three flat parameters on
 * every page (`ecomm_prodid`, `ecomm_pagetype`, `ecomm_totalvalue`). They ride
 * along with the GA4-style event so a single push serves both the conversion
 * tag and the remarketing tag.
 */

/** Google Ads dynamic remarketing page types (Custom vertical). */
export type EcommPageType =
  | 'home'
  | 'searchresults'
  | 'category'
  | 'product'
  | 'other';

export interface EcommParams {
  /** MUST match the `id` column of the product feed — i.e. the numeric ads.id. */
  ecomm_prodid?: string | string[];
  ecomm_pagetype: EcommPageType;
  ecomm_totalvalue?: number;
}

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/**
 * The dataLayer is a persistent merged model, not a queue of isolated messages:
 * keys pushed by one event remain visible to every later event. Left alone, a
 * visitor who views ad 4821 and then runs a search would still carry
 * ecomm_prodid=4821 into the search event, and Google Ads would retarget them
 * with the wrong listing. Resetting the trio on every push prevents that.
 */
const ECOMM_RESET: Record<string, unknown> = {
  ecomm_prodid: undefined,
  ecomm_pagetype: undefined,
  ecomm_totalvalue: undefined,
};

/** Push a named event to the GTM dataLayer. Safe no-op before GTM loads. */
export function pushEvent(
  event: string,
  params?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ...ECOMM_RESET, event, ...params });
}

/**
 * Push an event carrying dynamic-remarketing parameters.
 * Every page should report a pagetype so remarketing audiences can segment
 * browsers from searchers from viewers.
 */
export function pushEcommEvent(
  event: string,
  ecomm: EcommParams,
  params?: Record<string, unknown>
): void {
  pushEvent(event, { ...ecomm, ...params });
}

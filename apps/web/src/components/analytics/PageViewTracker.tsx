'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { trackPageView, type EcommPageType } from '@/lib/analytics';

/**
 * Reports a GTM page_view on every App Router navigation.
 *
 * The GTM container script pushes `gtm.js` once on mount and never fires again
 * on soft navigations, so without this the container would only ever see the
 * first page of a session. (Meta's PageView is handled separately inside
 * MetaPixel.tsx.)
 *
 * Ad detail pages are deliberately skipped: TrackViewContent fires `view_item`
 * there carrying `ecomm_prodid`, and pushing a bare page_view alongside it
 * would give the remarketing tag two competing events for one page.
 */

/** Strip the /{lang} prefix so matching works for both `en` and `ne`. */
function pageTypeFor(pathname: string): EcommPageType | null {
  const path = pathname.replace(/^\/(en|ne)(?=\/|$)/, '') || '/';

  if (path === '/') return 'home';
  if (path.startsWith('/ad/')) return null; // handled by TrackViewContent
  if (path === '/ads') return 'searchresults';
  if (path.startsWith('/ads/')) return 'category';
  return 'other';
}

export function PageViewTracker() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // The container's initial load already registers the entry page.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const pageType = pageTypeFor(pathname);
    if (pageType) trackPageView(pageType);
  }, [pathname]);

  return null;
}

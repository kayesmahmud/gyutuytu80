/**
 * Unlisted Signboard Generator
 * /[lang]/oursignboard — shop owners we send the link to make their own board.
 *
 * Deliberately undiscoverable: nothing links to it, it is absent from the
 * sitemap, and it returns noindex. Reachable as /oursignboard too; middleware
 * sends that to the default locale, so the link can be given out verbally.
 *
 * English only. The page sits under [lang] because that layout carries the site
 * chrome, but it is not translated, so middleware sends any other locale to /en
 * rather than serving a half-Nepali page — the header's language toggle links
 * straight here, so that path is reachable in normal use. That redirect cannot
 * live in this file: [lang] is force-dynamic, so a redirect() here only takes
 * effect client-side after a 200 has already been sent.
 *
 * Shares the renderer with the staff tool at /[lang]/editor/signboard, so a
 * shop-made board and a staff-made board are byte-for-byte the same design.
 *
 * Note this is obscurity, not access control — anyone holding the URL can use
 * it. Gate it behind sign-in if that ever matters.
 */

import { Metadata } from 'next';

import { OurSignboardClient } from './OurSignboardClient';

const PATH = '/en/oursignboard';

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';
  const title = 'Free Shop Signboard Maker | Thulo Bazaar';
  const description =
    'Make a free, print-ready signboard for your shop with your Thulo Bazaar link. Choose any size from 4 ft to 10 ft wide and download it as PNG, JPG or PDF.';

  // Always the English URL: it is the only version that renders.
  const url = `${baseUrl}${PATH}`;

  return {
    title,
    description,
    // Kept so the link previews properly when it is messaged to a shop owner.
    // Social crawlers do not put a page into search results; hreflang would, so
    // there are deliberately no `languages` alternates below.
    openGraph: {
      title,
      description,
      url,
      siteName: 'Thulo Bazaar',
      locale: 'en_US',
      type: 'website',
    },
    // Returned from the page's own generateMetadata rather than a layout, which
    // is the form that actually serialises (see 10370f0).
    //
    // noindex WITHOUT a robots.txt Disallow is deliberate: a blocked URL cannot
    // be crawled, so Google would never read the noindex and any URL that leaked
    // could stick as "Indexed, though blocked by robots.txt" — the one state
    // that cannot self-correct. Same reasoning as /shops.
    robots: { index: false, follow: false },
    alternates: { canonical: url },
  };
}

export default function OurSignboardPage() {
  return <OurSignboardClient />;
}

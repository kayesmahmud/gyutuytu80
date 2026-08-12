/**
 * Client-safe URL building utilities
 * These functions can be used in both server and client components
 * because they don't depend on Node.js modules like Prisma/pg
 */

/**
 * Normalize query parameters to ensure consistent ordering
 * Google treats ?a=1&b=2 differently from ?b=2&a=1
 * This function sorts params alphabetically for consistent canonical URLs
 *
 * @param params - Query parameters object
 * @returns Normalized query string with sorted parameters
 */
function normalizeQueryParams(params: Record<string, string | number | boolean | undefined | null>): string {
  // Filter out undefined/null values and sort alphabetically
  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => [key, String(value)] as [string, string])
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

  if (entries.length === 0) return '';

  return new URLSearchParams(entries).toString();
}

/**
 * Build SEO-friendly ad browsing URL from location and category
 *
 * @param lang - Language code (e.g., 'en', 'np')
 * @param locationSlug - Location slug (optional)
 * @param categorySlug - Category slug (optional)
 * @param queryParams - Additional query parameters (search, price, etc.)
 * @returns SEO-friendly URL path
 */
export function buildAdUrl(
  lang: string,
  locationSlug?: string | null,
  categorySlug?: string | null,
  queryParams?: Record<string, string | number | boolean | undefined | null>
): string {
  // Build path segments
  const segments = [lang, 'ads'];

  if (locationSlug) {
    segments.push(locationSlug);
  }

  if (categorySlug) {
    segments.push(categorySlug);
  }

  let url = `/${segments.join('/')}`;

  // Add normalized query parameters if provided
  if (queryParams) {
    const queryString = normalizeQueryParams(queryParams);
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  return url;
}

/**
 * Generate SEO metadata for ad listing pages
 *
 * @param locationName - Location name (e.g., "Kathmandu")
 * @param categoryName - Category name (e.g., "Mobiles")
 * @param searchQuery - Search query if applicable
 * @param totalAds - Total number of ads matching filters
 * @returns Metadata for Next.js generateMetadata
 */
export function generateAdListingMetadata(
  locationName: string | null,
  categoryName: string | null,
  searchQuery: string | null,
  totalAds: number,
  options?: { lang?: string; path?: string; page?: number }
) {
  let title = '';
  let description = '';

  if (searchQuery) {
    // Search mode
    if (locationName && categoryName) {
      title = `Search "${searchQuery}" in ${categoryName} - ${locationName} | Thulo Bazaar`;
      description = `Find ${searchQuery} in ${categoryName} category in ${locationName}. Search ${totalAds.toLocaleString()} ads.`;
    } else if (locationName) {
      title = `Search "${searchQuery}" in ${locationName} | Thulo Bazaar`;
      description = `Search results for "${searchQuery}" in ${locationName}. ${totalAds.toLocaleString()} ads found.`;
    } else if (categoryName) {
      title = `Search "${searchQuery}" in ${categoryName} | Thulo Bazaar`;
      description = `Search results for "${searchQuery}" in ${categoryName} category. ${totalAds.toLocaleString()} ads found.`;
    } else {
      title = `Search "${searchQuery}" | Thulo Bazaar`;
      description = `Search results for "${searchQuery}". ${totalAds.toLocaleString()} ads found across Nepal.`;
    }
  } else {
    // Browse mode
    if (locationName && categoryName) {
      title = `${categoryName} in ${locationName} | Thulo Bazaar`;
      description = `Search ${totalAds.toLocaleString()} ${categoryName} ads in ${locationName}. Find the best deals on classified ads in Nepal.`;
    } else if (locationName) {
      title = `Ads in ${locationName} | Thulo Bazaar`;
      description = `Search ${totalAds.toLocaleString()} classified ads in ${locationName}. Find electronics, vehicles, property, and more.`;
    } else if (categoryName) {
      title = `${categoryName} Ads in Nepal | Thulo Bazaar`;
      description = `Search ${totalAds.toLocaleString()} ${categoryName} ads across Nepal. Find the best deals on classified ads.`;
    } else {
      title = `All Ads in Nepal | Thulo Bazaar`;
      description = `Search ${totalAds.toLocaleString()} classified ads across Nepal. Find electronics, vehicles, property, and more.`;
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';
  const lang = options?.lang || 'en';
  const path = options?.path || `/${lang}/ads`;
  const page = options?.page || 1;

  // SEO Fix: Use page 1 as canonical (no page param for page 1)
  // This consolidates all paginated results under the first page URL
  const pageSuffix = page > 1 ? `?page=${page}` : '';
  const canonicalSuffix = ''; // Canonical always points to page 1 (no page param)
  const url = `${baseUrl}${path}${pageSuffix}`;
  const canonicalUrl = `${baseUrl}${path}${canonicalSuffix}`;

  const otherLang = lang === 'en' ? 'ne' : 'en';
  const otherPath = path.replace(`/${lang}/`, `/${otherLang}/`);

  return {
    title: page > 1 ? `${title} - Page ${page}` : title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'Thulo Bazaar',
      locale: lang === 'ne' ? 'ne_NP' : 'en_US',
      type: 'website' as const,
    },
    twitter: {
      card: 'summary' as const,
      title,
      description,
    },
    alternates: {
      // SEO Fix: Page 1 is the canonical for all variations
      canonical: canonicalUrl,
      languages: {
        en: `${baseUrl}${lang === 'en' ? path : otherPath}${canonicalSuffix}`,
        ne: `${baseUrl}${lang === 'ne' ? path : otherPath}${canonicalSuffix}`,
        'x-default': `${baseUrl}${lang === 'en' ? path : otherPath}${canonicalSuffix}`,
      },
    },
  };
}

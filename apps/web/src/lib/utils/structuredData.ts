/**
 * Generate JSON-LD structured data for SEO
 * https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
 */

interface ProductStructuredDataProps {
  name: string;
  description: string;
  image: string[];
  price: number;
  currency: string;
  condition?: 'NewCondition' | 'UsedCondition' | 'RefurbishedCondition';
  availability: 'InStock' | 'OutOfStock' | 'PreOrder';
  url: string;
  seller: {
    name: string;
    type: 'Person' | 'Organization';
    /** Seller's shop page — links the listing to the seller entity. */
    url?: string;
  };
  category?: string;
  location?: string;
  /** Ad ID, used as the stable identifier for this listing. */
  sku?: string | number;
  /** When the listing went live (approval time). */
  validFrom?: Date | null;
  /** When the listing expires — Google warns on offers with no priceValidUntil. */
  priceValidUntil?: Date | null;
}

const toIsoDate = (date?: Date | null): string | undefined =>
  date ? date.toISOString().split('T')[0] : undefined;

export function generateProductStructuredData(props: ProductStructuredDataProps) {
  const validFrom = toIsoDate(props.validFrom);
  const priceValidUntil = toIsoDate(props.priceValidUntil);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': props.url,
    name: props.name,
    description: props.description,
    image: props.image,
    ...(props.sku && { sku: String(props.sku), productID: String(props.sku) }),
    offers: {
      '@type': 'Offer',
      price: props.price,
      priceCurrency: props.currency,
      // Only assert a condition when the ad actually has one (don't claim "Used"
      // for listings like rentals where condition doesn't apply).
      ...(props.condition && { itemCondition: `https://schema.org/${props.condition}` }),
      availability: `https://schema.org/${props.availability}`,
      url: props.url,
      ...(validFrom && { validFrom }),
      ...(priceValidUntil && { priceValidUntil }),
      seller: {
        '@type': props.seller.type,
        name: props.seller.name,
        ...(props.seller.url && { url: props.seller.url }),
      },
      // Where the item can actually be collected. `locationCreated` was wrong
      // here — it's a CreativeWork property, not an offer's location.
      ...(props.location && {
        availableAtOrFrom: {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressLocality: props.location,
            addressCountry: 'NP',
          },
        },
      }),
    },
    ...(props.category && { category: props.category }),
  };
}

interface BreadcrumbStructuredDataProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export function generateBreadcrumbStructuredData(props: BreadcrumbStructuredDataProps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: props.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

interface OrganizationStructuredDataProps {
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs?: string[]; // Social media profiles
}

export function generateOrganizationStructuredData(props: OrganizationStructuredDataProps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: props.name,
    url: props.url,
    logo: props.logo,
    description: props.description,
    ...(props.sameAs && { sameAs: props.sameAs }),
  };
}

interface WebsiteStructuredDataProps {
  name: string;
  url: string;
  description: string;
  searchUrl: string; // e.g., "https://thulobazaar.com.np/search?q={search_term_string}"
}

export function generateWebsiteStructuredData(props: WebsiteStructuredDataProps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: props.name,
    url: props.url,
    description: props.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: props.searchUrl,
      'query-input': 'required name=search_term_string',
    },
  };
}

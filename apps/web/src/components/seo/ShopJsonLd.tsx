interface ShopJsonLdProps {
  name: string;
  description: string;
  url: string;
  image?: string;
  location?: string;
  /** Absolute URLs of the seller's own profiles (Facebook, Instagram, TikTok, website). */
  sameAs?: string[];
  telephone?: string;
  /** Number of approved ads currently listed. */
  numberOfItems?: number;
}

export function ShopJsonLd(props: ShopJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': props.url,
    name: props.name,
    description: props.description,
    url: props.url,
    ...(props.image && { image: props.image }),
    ...(props.telephone && { telephone: props.telephone }),
    ...(props.sameAs?.length && { sameAs: props.sameAs }),
    ...(props.location && {
      address: {
        '@type': 'PostalAddress',
        addressLocality: props.location,
        addressCountry: 'NP',
      },
    }),
    ...(typeof props.numberOfItems === 'number' && {
      makesOffer: {
        '@type': 'OfferCatalog',
        name: `Listings by ${props.name}`,
        url: props.url,
        numberOfItems: props.numberOfItems,
      },
    }),
  };

  // JSON.stringify produces safe output — no XSS risk from structured data we control
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

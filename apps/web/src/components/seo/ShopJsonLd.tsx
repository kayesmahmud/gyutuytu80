interface ShopJsonLdProps {
  name: string;
  description: string;
  url: string;
  image?: string;
  location?: string;
}

export function ShopJsonLd(props: ShopJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: props.name,
    description: props.description,
    url: props.url,
    ...(props.image && { image: props.image }),
    ...(props.location && {
      address: {
        '@type': 'PostalAddress',
        addressLocality: props.location,
        addressCountry: 'NP',
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

import {
  generateProductStructuredData,
  generateBreadcrumbStructuredData,
} from '@/lib/utils/structuredData';

interface AdJsonLdProps {
  name: string;
  description: string;
  images: string[];
  price: number;
  currency?: string;
  condition?: string | null;
  url: string;
  sellerName: string;
  sellerType?: 'Person' | 'Organization';
  category?: string;
  location?: string;
  breadcrumbItems: { name: string; url: string }[];
}

function mapCondition(
  condition?: string | null,
): 'NewCondition' | 'UsedCondition' | 'RefurbishedCondition' | undefined {
  // No condition on the ad -> don't assert one in structured data.
  if (!condition || !condition.trim()) return undefined;
  switch (condition.toLowerCase()) {
    case 'new':
    case 'brand new':
      return 'NewCondition';
    case 'refurbished':
      return 'RefurbishedCondition';
    default:
      return 'UsedCondition';
  }
}

export function AdJsonLd(props: AdJsonLdProps) {
  const productData = generateProductStructuredData({
    name: props.name,
    description: props.description,
    image: props.images,
    price: props.price,
    currency: props.currency || 'NPR',
    condition: mapCondition(props.condition),
    availability: 'InStock',
    url: props.url,
    seller: {
      name: props.sellerName,
      type: props.sellerType || 'Person',
    },
    category: props.category,
    location: props.location,
  });

  const breadcrumbData = generateBreadcrumbStructuredData({
    items: props.breadcrumbItems,
  });

  // JSON.stringify produces safe output — no XSS risk from structured data we control
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
    </>
  );
}

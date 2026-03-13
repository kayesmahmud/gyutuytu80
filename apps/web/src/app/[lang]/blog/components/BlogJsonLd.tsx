interface BlogPostJsonLdProps {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  publishedAt?: string;
  updatedAt?: string;
  authorName: string;
  authorUrl: string;
  authorImage?: string;
  authorCredentials?: string;
  authorSocialLinks?: Record<string, string>;
  categoryName: string;
  tags?: string[];
  wordCount?: number;
  lang: string;
}

export function BlogPostJsonLd(props: BlogPostJsonLdProps) {
  const sameAs = props.authorSocialLinks
    ? Object.values(props.authorSocialLinks).filter(Boolean)
    : [];

  const data = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: props.title,
    description: props.description,
    ...(props.imageUrl && { image: props.imageUrl }),
    ...(props.publishedAt && { datePublished: props.publishedAt }),
    ...(props.updatedAt && { dateModified: props.updatedAt }),
    author: {
      '@type': 'Person',
      name: props.authorName,
      url: props.authorUrl,
      ...(props.authorImage && { image: props.authorImage }),
      ...(props.authorCredentials && { jobTitle: props.authorCredentials }),
      ...(sameAs.length > 0 && { sameAs }),
    },
    publisher: {
      '@type': 'Organization',
      name: 'Thulo Bazaar',
      url: 'https://thulobazaar.com.np',
      logo: {
        '@type': 'ImageObject',
        url: 'https://thulobazaar.com.np/logo.png',
      },
    },
    mainEntityOfPage: props.url,
    articleSection: props.categoryName,
    ...(props.tags && { keywords: props.tags.join(', ') }),
    ...(props.wordCount && { wordCount: props.wordCount }),
    inLanguage: props.lang === 'ne' ? 'ne' : 'en',
  };

  // JSON.stringify produces safe output — no XSS risk from structured data we control
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

interface AuthorJsonLdProps {
  name: string;
  url: string;
  image?: string;
  description?: string;
  credentials?: string;
  socialLinks?: Record<string, string>;
}

export function AuthorJsonLd(props: AuthorJsonLdProps) {
  const sameAs = props.socialLinks
    ? Object.values(props.socialLinks).filter(Boolean)
    : [];

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: props.name,
    url: props.url,
    ...(props.image && { image: props.image }),
    ...(props.description && { description: props.description }),
    ...(props.credentials && { jobTitle: props.credentials }),
    ...(sameAs.length > 0 && { sameAs }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

interface BreadcrumbJsonLdProps {
  items: { name: string; url: string }[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

import { Metadata } from 'next';

/**
 * SEO: Apply noindex to paginated ads listings
 * Page 1 (no ?page param) is indexable
 * Pages 2+ are marked noindex to prevent duplicate content
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;

  // Don't index paginated results (page 2+)
  if (page > 1) {
    return {
      robots: { index: false, follow: true },
    };
  }

  // Page 1 is indexable (default)
  return {};
}

export default function AdsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

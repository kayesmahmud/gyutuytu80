/**
 * Layout wrapper for ads pages
 * Note: Metadata is handled at page level (generateMetadata in page.tsx)
 * because layout-level generateMetadata cannot access child route searchParams
 */
export default function AdsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

import Link from 'next/link';

interface AdsPaginationProps {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}

const MAX_VISIBLE = 5;

/**
 * Numbered pagination nav shared by the /ads browse page and the homepage
 * Latest Ads feed, so both listings paginate identically.
 */
export default function AdsPagination({ page, totalPages, buildHref }: AdsPaginationProps) {
  if (totalPages <= 1) return null;

  // Calculate visible page numbers (max 5)
  const pages: (number | '...')[] = [];
  if (totalPages <= MAX_VISIBLE + 2) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    const half = Math.floor(MAX_VISIBLE / 2);
    let start = Math.max(2, page - half);
    let end = Math.min(totalPages - 1, page + half);
    if (page <= half + 1) end = Math.min(MAX_VISIBLE, totalPages - 1);
    if (page >= totalPages - half) start = Math.max(2, totalPages - MAX_VISIBLE + 1);

    pages.push(1);
    if (start > 2) pages.push('...');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('...');
    pages.push(totalPages);
  }

  const linkClass = 'px-3 py-2 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-rose-500 transition-colors';
  const disabledClass = 'px-3 py-2 text-sm font-medium bg-white border border-gray-200 rounded-lg opacity-50 cursor-not-allowed';
  const activeClass = 'px-3 py-2 text-sm font-medium bg-rose-500 text-white rounded-lg shadow-md';

  return (
    <nav className="flex items-center justify-center gap-1.5 sm:gap-2 mt-6" aria-label="Pagination">
      {/* First page */}
      {page > 2 && (
        <Link href={buildHref(1)} className={linkClass} aria-label="First page">«</Link>
      )}
      {/* Previous */}
      {page > 1 ? (
        <Link href={buildHref(page - 1)} className={linkClass} aria-label="Previous page">‹</Link>
      ) : (
        <span className={disabledClass} aria-disabled="true">‹</span>
      )}

      {/* Page numbers - hidden on mobile, show compact indicator instead */}
      <div className="hidden sm:flex items-center gap-1.5">
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-2 py-2 text-sm text-gray-400">…</span>
          ) : p === page ? (
            <span key={p} className={activeClass} aria-current="page">{p}</span>
          ) : (
            <Link key={p} href={buildHref(p)} className={linkClass}>{p}</Link>
          )
        )}
      </div>
      {/* Mobile: compact page indicator */}
      <div className="flex sm:hidden items-center px-3 py-2 text-sm font-medium bg-white border border-gray-200 rounded-lg">
        <span className="font-semibold text-rose-500">{page}</span>
        <span className="mx-1">/</span>
        <span>{totalPages}</span>
      </div>

      {/* Next */}
      {page < totalPages ? (
        <Link href={buildHref(page + 1)} className={linkClass} aria-label="Next page">›</Link>
      ) : (
        <span className={disabledClass} aria-disabled="true">›</span>
      )}
      {/* Last page */}
      {page < totalPages - 1 && (
        <Link href={buildHref(totalPages)} className={linkClass} aria-label="Last page">»</Link>
      )}
    </nav>
  );
}

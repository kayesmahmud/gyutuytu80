import Link from 'next/link';

interface BlogPaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

export default function BlogPagination({ currentPage, totalPages, basePath }: BlogPaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  const getHref = (page: number) => {
    const separator = basePath.includes('?') ? '&' : '?';
    return page === 1 ? basePath : `${basePath}${separator}page=${page}`;
  };

  return (
    <nav className="flex justify-center items-center gap-1 mt-8" aria-label="Pagination">
      {currentPage > 1 && (
        <Link
          href={getHref(currentPage - 1)}
          className="px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          &larr;
        </Link>
      )}

      {pages.map((page, i) =>
        page === '...' ? (
          <span key={`dots-${i}`} className="px-2 py-2 text-sm text-gray-400">...</span>
        ) : (
          <Link
            key={page}
            href={getHref(page)}
            className={`px-3 py-2 text-sm rounded-lg border ${
              page === currentPage
                ? 'bg-rose-600 text-white border-rose-600 font-semibold'
                : 'text-gray-600 bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            {page}
          </Link>
        )
      )}

      {currentPage < totalPages && (
        <Link
          href={getHref(currentPage + 1)}
          className="px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          &rarr;
        </Link>
      )}
    </nav>
  );
}

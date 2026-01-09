import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items = [], className = '' }: BreadcrumbProps) {
  return (
    // Hidden on mobile, visible on desktop (lg breakpoint)
    <nav
      aria-label="Breadcrumb"
      className={`hidden lg:block py-5 px-4 bg-gray-50 border-b border-gray-200 ${className}`}
    >
      <ol className="flex items-center gap-2 text-sm text-gray-500 max-w-7xl mx-auto">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {index > 0 && <span className="text-gray-400" aria-hidden="true">›</span>}
            {item.path && !item.current ? (
              <Link
                href={item.path}
                className="text-blue-500 hover:text-blue-600 hover:underline transition-colors duration-200"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 font-medium" aria-current={item.current ? 'page' : undefined}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

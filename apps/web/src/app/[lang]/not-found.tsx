/**
 * Language-aware 404 Not Found Page
 */

import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '404 - Page Not Found | Thulo Bazaar',
  robots: { index: false, follow: true },
};

const POPULAR_CATEGORIES = [
  { name: 'Mobiles', slug: 'mobiles', icon: '📱' },
  { name: 'Electronics', slug: 'electronics', icon: '💻' },
  { name: 'Vehicles', slug: 'vehicles', icon: '🚗' },
  { name: 'Property', slug: 'property', icon: '🏠' },
  { name: 'Jobs', slug: 'jobs', icon: '💼' },
  { name: 'Services', slug: 'services', icon: '🔧' },
];

export default function NotFound() {
  // Note: not-found.tsx doesn't receive params in Next.js,
  // so we default to 'en'. Language detection happens at the layout level.
  const lang = 'en';

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center bg-gray-50">
      <div className="max-w-lg">
        <h1 className="text-8xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          404
        </h1>

        <h2 className="text-3xl font-semibold text-gray-900 mb-2">
          Page Not Found
        </h2>

        <p className="text-gray-600 mb-8 text-lg">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
          It might have been moved or deleted.
        </p>

        {/* Search Bar */}
        <form action={`/${lang}/ads`} method="get" className="mb-8">
          <div className="flex gap-2 max-w-md mx-auto">
            <input
              type="text"
              name="query"
              placeholder="Search for ads..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Popular Categories */}
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-3">Or browse popular categories:</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {POPULAR_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/${lang}/ads/${cat.slug}`}
                className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow no-underline text-gray-700 hover:text-indigo-600"
              >
                <span className="text-2xl mb-1">{cat.icon}</span>
                <span className="text-xs font-medium">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href={`/${lang}`}
            className="px-6 py-3 bg-rose-500 text-white rounded-lg font-semibold hover:bg-rose-700 transition-colors no-underline"
          >
            Go Home
          </Link>
          <Link
            href={`/${lang}/ads`}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors no-underline"
          >
            Browse All Ads
          </Link>
        </div>
      </div>
    </div>
  );
}

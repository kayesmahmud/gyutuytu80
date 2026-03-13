import Link from 'next/link';
import { prisma } from '@thulobazaar/database';

interface BlogSidebarProps {
  lang: string;
  currentCategorySlug?: string;
  currentTagSlug?: string;
}

export default async function BlogSidebar({ lang, currentCategorySlug, currentTagSlug }: BlogSidebarProps) {
  const isNe = lang === 'ne';

  const [categories, tags, featuredPosts] = await Promise.all([
    prisma.blog_categories.findMany({
      where: { is_active: true },
      include: { _count: { select: { blog_posts: { where: { status: 'published' } } } } },
      orderBy: { display_order: 'asc' },
    }),
    prisma.blog_tags.findMany({
      include: { _count: { select: { blog_post_tags: true } } },
      orderBy: { name: 'asc' },
      take: 20,
    }),
    prisma.blog_posts.findMany({
      where: { status: 'published', is_featured: true },
      select: {
        title: true,
        title_ne: true,
        slug: true,
        featured_image: true,
        published_at: true,
      },
      orderBy: { published_at: 'desc' },
      take: 5,
    }),
  ]);

  return (
    <aside className="space-y-6">
      {/* Categories */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-bold text-gray-900 mb-3">
          {isNe ? 'विषयहरू' : 'Categories'}
        </h3>
        <ul className="space-y-2">
          {categories.map(cat => (
            <li key={cat.id}>
              <Link
                href={`/${lang}/blog/category/${cat.slug}`}
                className={`flex justify-between items-center text-sm py-1 transition-colors ${
                  currentCategorySlug === cat.slug
                    ? 'text-rose-600 font-semibold'
                    : 'text-gray-600 hover:text-rose-600'
                }`}
              >
                <span>{(isNe && cat.name_ne) || cat.name}</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {cat._count.blog_posts}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-900 mb-3">
            {isNe ? 'ट्यागहरू' : 'Popular Tags'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {tags.filter(t => t._count.blog_post_tags > 0).map(tag => (
              <Link
                key={tag.id}
                href={`/${lang}/blog/tag/${tag.slug}`}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  currentTagSlug === tag.slug
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-rose-300 hover:text-rose-600'
                }`}
              >
                {(isNe && tag.name_ne) || tag.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-900 mb-3">
            {isNe ? 'लोकप्रिय लेखहरू' : 'Featured Articles'}
          </h3>
          <ul className="space-y-3">
            {featuredPosts.map(post => (
              <li key={post.slug}>
                <Link
                  href={`/${lang}/blog/${post.slug}`}
                  className="text-sm text-gray-700 hover:text-rose-600 transition-colors line-clamp-2"
                >
                  {(isNe && post.title_ne) || post.title}
                </Link>
                {post.published_at && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(post.published_at).toLocaleDateString(isNe ? 'ne-NP' : 'en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

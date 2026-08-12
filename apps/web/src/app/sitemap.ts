import { MetadataRoute } from 'next';
import { prisma } from '@thulobazaar/database';

// Generate at request time (DB not available during build)
export const dynamic = 'force-dynamic';

/**
 * Sitemap generation strategy:
 * - Includes static pages, categories, ads, shops, blog content
 * - Does NOT include paginated results (?page=2, etc.) to avoid duplicate content
 * - Does NOT include filtered variations (?sortBy=, ?minPrice=, etc.) to reduce crawl budget waste
 * - Google will discover filter combinations via internal links
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';

  // Parallel data fetching for performance
  const [ads, categories, locations, blogPosts, blogCategories, blogAuthors, blogTags, shops] = await Promise.all([
    // Fetch all approved ads
    prisma.ads.findMany({
      where: { status: 'approved', deleted_at: null },
      select: { slug: true, updated_at: true },
      orderBy: { updated_at: 'desc' },
      take: 50000,
    }),
    // Fetch all parent categories
    prisma.categories.findMany({
      where: { parent_id: null },
      select: { slug: true },
    }),
    // Fetch all provinces (parent locations) for location browse pages
    prisma.locations.findMany({
      where: { parent_id: null },
      select: { slug: true },
    }),
    // Fetch published blog posts
    prisma.blog_posts.findMany({
      where: { status: 'published', published_at: { not: null } },
      select: { slug: true, updated_at: true },
      orderBy: { published_at: 'desc' },
      take: 50000,
    }),
    // Fetch active blog categories
    prisma.blog_categories.findMany({
      where: { is_active: true },
      select: { slug: true },
    }),
    // Fetch active blog authors
    prisma.blog_authors.findMany({
      where: { is_active: true },
      select: { slug: true },
    }),
    // Fetch blog tags
    prisma.blog_tags.findMany({
      select: { slug: true },
    }).catch(() => [] as { slug: string }[]),
    // Fetch shop profiles (users with shop_slug)
    prisma.users.findMany({
      where: {
        is_active: true,
        shop_slug: { not: null },
      },
      select: { shop_slug: true, custom_shop_slug: true },
      take: 50000,
    }),
  ]);

  // Static pages (both languages)
  const staticPages: MetadataRoute.Sitemap = ['en', 'ne'].flatMap((lang) => [
    { url: `${baseUrl}/${lang}`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/${lang}/ads`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/${lang}/shops`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/${lang}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/${lang}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/${lang}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/${lang}/help`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/${lang}/support`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ]);

  // Category pages (both languages)
  const categoryPages = categories.flatMap((category) =>
    ['en', 'ne'].map((lang) => ({
      url: `${baseUrl}/${lang}/ads/${category.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))
  );

  // Location pages (both languages) - province-level browse pages
  const locationPages = locations.flatMap((location) =>
    ['en', 'ne'].map((lang) => ({
      url: `${baseUrl}/${lang}/ads/${location.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))
  );

  // Ad detail pages (both languages)
  const adPages = ads.flatMap((ad) =>
    ['en', 'ne'].map((lang) => ({
      url: `${baseUrl}/${lang}/ad/${ad.slug}`,
      lastModified: ad.updated_at || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  );

  // Shop profile pages (both languages)
  const shopPages = shops.flatMap((shop) => {
    const slug = shop.custom_shop_slug || shop.shop_slug;
    if (!slug) return [];
    return ['en', 'ne'].map((lang) => ({
      url: `${baseUrl}/${lang}/shop/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  });

  // Blog post pages (both languages)
  const blogPostPages = blogPosts.flatMap((post) =>
    ['en', 'ne'].map((lang) => ({
      url: `${baseUrl}/${lang}/blog/${post.slug}`,
      lastModified: post.updated_at || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  );

  // Blog category pages (both languages)
  const blogCategoryPages = blogCategories.flatMap((cat) =>
    ['en', 'ne'].map((lang) => ({
      url: `${baseUrl}/${lang}/blog/category/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))
  );

  // Blog author pages (both languages)
  const blogAuthorPages = blogAuthors.flatMap((author) =>
    ['en', 'ne'].map((lang) => ({
      url: `${baseUrl}/${lang}/blog/author/${author.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }))
  );

  // Blog tag pages (both languages)
  const blogTagPages = blogTags.flatMap((tag) =>
    ['en', 'ne'].map((lang) => ({
      url: `${baseUrl}/${lang}/blog/tag/${tag.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }))
  );

  return [
    ...staticPages,
    ...categoryPages,
    ...locationPages,
    ...adPages,
    ...shopPages,
    ...blogPostPages,
    ...blogCategoryPages,
    ...blogAuthorPages,
    ...blogTagPages,
  ];
}

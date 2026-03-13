import { MetadataRoute } from 'next';
import { prisma } from '@thulobazaar/database';

// Generate at request time (DB not available during build)
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';

  // Fetch all approved ads
  const ads = await prisma.ads.findMany({
    where: {
      status: 'approved',
      deleted_at: null,
    },
    select: {
      slug: true,
      updated_at: true,
    },
    orderBy: {
      updated_at: 'desc',
    },
    take: 50000, // Google sitemap limit
  });

  // Fetch all categories
  const categories = await prisma.categories.findMany({
    where: {
      parent_id: null, // Only parent categories
    },
    select: {
      slug: true,
    },
  });

  // Fetch published blog posts
  const blogPosts = await prisma.blog_posts.findMany({
    where: { status: 'published', published_at: { not: null } },
    select: { slug: true, updated_at: true },
    orderBy: { published_at: 'desc' },
    take: 50000,
  });

  // Fetch active blog categories and authors
  const [blogCategories, blogAuthors] = await Promise.all([
    prisma.blog_categories.findMany({
      where: { is_active: true },
      select: { slug: true },
    }),
    prisma.blog_authors.findMany({
      where: { is_active: true },
      select: { slug: true },
    }),
  ]);

  // Static pages
  const staticPages = [
    {
      url: `${baseUrl}/en`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/en/ads`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/en/post-ad`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ];

  // Category pages
  const categoryPages = categories.map((category) => ({
    url: `${baseUrl}/en/ads/category/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // Ad detail pages
  const adPages = ads.map((ad) => ({
    url: `${baseUrl}/en/ad/${ad.slug}`,
    lastModified: ad.updated_at || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Blog listing page
  const blogStaticPages = [
    {
      url: `${baseUrl}/en/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/ne/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
  ];

  // Blog post pages (both languages)
  const blogPostPages = blogPosts.flatMap((post) => [
    {
      url: `${baseUrl}/en/blog/${post.slug}`,
      lastModified: post.updated_at || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/ne/blog/${post.slug}`,
      lastModified: post.updated_at || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
  ]);

  // Blog category pages
  const blogCategoryPages = blogCategories.flatMap((cat) => [
    {
      url: `${baseUrl}/en/blog/category/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/ne/blog/category/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
  ]);

  // Blog author pages
  const blogAuthorPages = blogAuthors.flatMap((author) => [
    {
      url: `${baseUrl}/en/blog/author/${author.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/ne/blog/author/${author.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    },
  ]);

  return [
    ...staticPages,
    ...categoryPages,
    ...adPages,
    ...blogStaticPages,
    ...blogPostPages,
    ...blogCategoryPages,
    ...blogAuthorPages,
  ];
}

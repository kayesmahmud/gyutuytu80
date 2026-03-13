import { Metadata } from 'next';
import { prisma } from '@thulobazaar/database';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { BlogCard, BlogPagination, BlogSidebar, BreadcrumbJsonLd } from '../../components';

interface TagPageProps {
  params: Promise<{ lang: string; slug: string }>;
  searchParams?: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';
  const isNe = lang === 'ne';

  const tag = await prisma.blog_tags.findUnique({ where: { slug } });
  if (!tag) return { title: 'Tag Not Found' };

  const name = (isNe && tag.name_ne) || tag.name;

  return {
    title: `#${name} - ${isNe ? 'ब्लग' : 'Blog'} | Thulo Bazaar`,
    description: isNe
      ? `${name} विषयमा लेखहरू - Thulo Bazaar`
      : `Articles tagged with ${name} on Thulo Bazaar`,
    alternates: {
      canonical: `${baseUrl}/${lang}/blog/tag/${slug}`,
      languages: {
        en: `${baseUrl}/en/blog/tag/${slug}`,
        ne: `${baseUrl}/ne/blog/tag/${slug}`,
      },
    },
    openGraph: {
      title: `#${name}`,
      description: `Articles tagged with ${name}`,
      url: `${baseUrl}/${lang}/blog/tag/${slug}`,
      siteName: 'Thulo Bazaar',
      locale: isNe ? 'ne_NP' : 'en_US',
      type: 'website',
    },
  };
}

export default async function BlogTagPage({ params, searchParams }: TagPageProps) {
  const { lang, slug } = await params;
  const sp = searchParams ? await searchParams : {};
  const page = Math.max(1, parseInt(sp.page || '1'));
  const limit = 12;
  const isNe = lang === 'ne';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';

  setRequestLocale(lang);

  const tag = await prisma.blog_tags.findUnique({ where: { slug } });
  if (!tag) notFound();

  const tagName = (isNe && tag.name_ne) || tag.name;

  const [posts, total] = await Promise.all([
    prisma.blog_posts.findMany({
      where: {
        status: 'published',
        published_at: { not: null },
        blog_post_tags: { some: { tag_id: tag.id } },
      },
      select: {
        id: true, title: true, title_ne: true, slug: true,
        excerpt: true, excerpt_ne: true,
        featured_image: true, featured_image_alt: true, featured_image_alt_ne: true,
        reading_time_min: true, published_at: true,
        blog_authors: { select: { name: true, name_ne: true, slug: true, avatar: true } },
        blog_categories: { select: { name: true, name_ne: true, slug: true } },
      },
      orderBy: { published_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.blog_posts.count({
      where: {
        status: 'published',
        published_at: { not: null },
        blog_post_tags: { some: { tag_id: tag.id } },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: `${baseUrl}/${lang}` },
          { name: isNe ? 'ब्लग' : 'Blog', url: `${baseUrl}/${lang}/blog` },
          { name: `#${tagName}`, url: `${baseUrl}/${lang}/blog/tag/${slug}` },
        ]}
      />

      <div className="container-custom py-6 sm:py-8">
        <div className="mb-8">
          <nav className="text-sm text-gray-500 mb-3">
            <a href={`/${lang}`} className="hover:text-rose-600">{isNe ? 'गृहपृष्ठ' : 'Home'}</a>
            <span className="mx-2">/</span>
            <a href={`/${lang}/blog`} className="hover:text-rose-600">{isNe ? 'ब्लग' : 'Blog'}</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900">#{tagName}</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">#{tagName}</h1>
          <p className="text-gray-600 mt-2">
            {isNe
              ? `"${tagName}" ट्याग भएका ${total} लेखहरू`
              : `${total} ${total === 1 ? 'article' : 'articles'} tagged with "${tagName}"`}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {posts.map(post => (
                  <BlogCard key={post.id} post={post} lang={lang} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <p className="text-lg">
                  {isNe ? 'यस ट्यागमा कुनै लेख फेला परेन।' : 'No articles found with this tag.'}
                </p>
              </div>
            )}

            <BlogPagination
              currentPage={page}
              totalPages={totalPages}
              basePath={`/${lang}/blog/tag/${slug}`}
            />
          </div>

          <div className="w-full lg:w-72 xl:w-80 flex-shrink-0">
            <BlogSidebar lang={lang} />
          </div>
        </div>
      </div>
    </>
  );
}

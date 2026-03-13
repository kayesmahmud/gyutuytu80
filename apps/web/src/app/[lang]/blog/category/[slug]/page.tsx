import { Metadata } from 'next';
import { prisma } from '@thulobazaar/database';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { BlogCard, BlogPagination, BlogSidebar, BreadcrumbJsonLd } from '../../components';

interface CategoryPageProps {
  params: Promise<{ lang: string; slug: string }>;
  searchParams?: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';
  const isNe = lang === 'ne';

  const category = await prisma.blog_categories.findUnique({ where: { slug } });
  if (!category || !category.is_active) return { title: 'Category Not Found' };

  const name = (isNe && category.name_ne) || category.name;
  const description = (isNe && category.description_ne) || category.description || '';

  return {
    title: `${name} - ${isNe ? 'ब्लग' : 'Blog'} | Thulo Bazaar`,
    description: description || `${name} articles on Thulo Bazaar`,
    alternates: {
      canonical: `${baseUrl}/${lang}/blog/category/${slug}`,
      languages: {
        en: `${baseUrl}/en/blog/category/${slug}`,
        ne: `${baseUrl}/ne/blog/category/${slug}`,
      },
    },
    openGraph: {
      title: name,
      description: description || `${name} articles on Thulo Bazaar`,
      url: `${baseUrl}/${lang}/blog/category/${slug}`,
      siteName: 'Thulo Bazaar',
      locale: isNe ? 'ne_NP' : 'en_US',
      type: 'website',
    },
  };
}

export default async function BlogCategoryPage({ params, searchParams }: CategoryPageProps) {
  const { lang, slug } = await params;
  const sp = searchParams ? await searchParams : {};
  const page = Math.max(1, parseInt(sp.page || '1'));
  const limit = 12;
  const isNe = lang === 'ne';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';

  setRequestLocale(lang);

  const category = await prisma.blog_categories.findUnique({ where: { slug } });
  if (!category || !category.is_active) notFound();

  const categoryName = (isNe && category.name_ne) || category.name;

  const [posts, total] = await Promise.all([
    prisma.blog_posts.findMany({
      where: { status: 'published', category_id: category.id, published_at: { not: null } },
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
      where: { status: 'published', category_id: category.id, published_at: { not: null } },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: `${baseUrl}/${lang}` },
          { name: isNe ? 'ब्लग' : 'Blog', url: `${baseUrl}/${lang}/blog` },
          { name: categoryName, url: `${baseUrl}/${lang}/blog/category/${slug}` },
        ]}
      />

      <div className="container-custom py-6 sm:py-8">
        <div className="mb-8">
          <nav className="text-sm text-gray-500 mb-3">
            <a href={`/${lang}`} className="hover:text-rose-600">{isNe ? 'गृहपृष्ठ' : 'Home'}</a>
            <span className="mx-2">/</span>
            <a href={`/${lang}/blog`} className="hover:text-rose-600">{isNe ? 'ब्लग' : 'Blog'}</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{categoryName}</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{categoryName}</h1>
          {category.description && (
            <p className="text-gray-600 mt-2">
              {(isNe && category.description_ne) || category.description}
            </p>
          )}
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
                  {isNe ? 'यस श्रेणीमा कुनै लेख फेला परेन।' : 'No articles found in this category.'}
                </p>
              </div>
            )}

            <BlogPagination
              currentPage={page}
              totalPages={totalPages}
              basePath={`/${lang}/blog/category/${slug}`}
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

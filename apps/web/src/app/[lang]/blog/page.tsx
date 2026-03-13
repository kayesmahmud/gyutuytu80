import { Metadata } from 'next';
import { prisma } from '@thulobazaar/database';
import { setRequestLocale } from 'next-intl/server';
import { BlogCard, BlogSidebar, BlogPagination, BreadcrumbJsonLd } from './components';

interface BlogPageProps {
  params: Promise<{ lang: string }>;
  searchParams?: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { lang } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';
  const isNe = lang === 'ne';

  const title = isNe
    ? 'ब्लग - Thulo Bazaar | नेपालमा किनबेच गर्ने टिप्स'
    : 'Blog - Thulo Bazaar | Tips for Buying & Selling in Nepal';
  const description = isNe
    ? 'नेपालमा कार, मोटरसाइकल, मोबाइल, ल्यापटप र अन्य सामान किन्ने र बेच्ने बारेमा उपयोगी गाइडहरू र टिप्स।'
    : 'Useful guides and tips for buying and selling cars, motorbikes, mobiles, laptops, and more in Nepal.';

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${lang}/blog`,
      languages: { en: `${baseUrl}/en/blog`, ne: `${baseUrl}/ne/blog` },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${lang}/blog`,
      siteName: 'Thulo Bazaar',
      locale: isNe ? 'ne_NP' : 'en_US',
      type: 'website',
    },
  };
}

export default async function BlogPage({ params, searchParams }: BlogPageProps) {
  const { lang } = await params;
  const sp = searchParams ? await searchParams : {};
  const page = Math.max(1, parseInt(sp.page || '1'));
  const limit = 12;
  const isNe = lang === 'ne';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';

  setRequestLocale(lang);

  const [posts, total] = await Promise.all([
    prisma.blog_posts.findMany({
      where: { status: 'published', published_at: { not: null } },
      select: {
        id: true, title: true, title_ne: true, slug: true,
        excerpt: true, excerpt_ne: true,
        featured_image: true, featured_image_alt: true, featured_image_alt_ne: true,
        reading_time_min: true, published_at: true,
        blog_authors: {
          select: { name: true, name_ne: true, slug: true, avatar: true },
        },
        blog_categories: {
          select: { name: true, name_ne: true, slug: true },
        },
      },
      orderBy: { published_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.blog_posts.count({ where: { status: 'published', published_at: { not: null } } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: `${baseUrl}/${lang}` },
          { name: isNe ? 'ब्लग' : 'Blog', url: `${baseUrl}/${lang}/blog` },
        ]}
      />

      <div className="container-custom py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm text-gray-500 mb-3">
            <a href={`/${lang}`} className="hover:text-rose-600">{isNe ? 'गृहपृष्ठ' : 'Home'}</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{isNe ? 'ब्लग' : 'Blog'}</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {isNe ? 'ब्लग' : 'Blog'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isNe
              ? 'नेपालमा किनबेच गर्ने बारेमा उपयोगी गाइडहरू र टिप्स'
              : 'Guides, tips, and insights for buying and selling in Nepal'}
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Posts Grid */}
          <div className="flex-1">
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {posts.map(post => (
                  <BlogCard key={post.id} post={post} lang={lang} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <p className="text-lg">{isNe ? 'कुनै लेख फेला परेन।' : 'No articles found.'}</p>
              </div>
            )}

            <BlogPagination
              currentPage={page}
              totalPages={totalPages}
              basePath={`/${lang}/blog`}
            />
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-72 xl:w-80 flex-shrink-0">
            <BlogSidebar lang={lang} />
          </div>
        </div>
      </div>
    </>
  );
}

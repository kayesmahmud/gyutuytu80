import { Metadata } from 'next';
import { cache } from 'react';
import { prisma } from '@thulobazaar/database';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import Image from 'next/image';
import { getImageUrl } from '@/lib/images/imageUrl';
import { BlogCard, BlogPagination, AuthorJsonLd, BreadcrumbJsonLd } from '../../components';

interface AuthorPageProps {
  params: Promise<{ lang: string; slug: string }>;
  searchParams?: Promise<{ page?: string }>;
}

const getAuthor = cache(async (slug: string) => {
  return prisma.blog_authors.findUnique({ where: { slug } });
});

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';
  const isNe = lang === 'ne';

  const author = await getAuthor(slug);
  if (!author || !author.is_active) return { title: 'Author Not Found' };

  const name = (isNe && author.name_ne) || author.name;
  const bio = (isNe && author.bio_ne) || author.bio || '';

  return {
    title: `${name} - ${isNe ? 'लेखक' : 'Author'} | Thulo Bazaar`,
    description: bio.slice(0, 160) || `Articles by ${name} on Thulo Bazaar`,
    alternates: {
      canonical: `${baseUrl}/${lang}/blog/author/${slug}`,
      languages: {
        en: `${baseUrl}/en/blog/author/${slug}`,
        ne: `${baseUrl}/ne/blog/author/${slug}`,
      },
    },
    openGraph: {
      title: name,
      description: bio.slice(0, 160) || `Articles by ${name}`,
      url: `${baseUrl}/${lang}/blog/author/${slug}`,
      siteName: 'Thulo Bazaar',
      locale: isNe ? 'ne_NP' : 'en_US',
      type: 'profile',
    },
  };
}

export default async function BlogAuthorPage({ params, searchParams }: AuthorPageProps) {
  const { lang, slug } = await params;
  const sp = searchParams ? await searchParams : {};
  const page = Math.max(1, parseInt(sp.page || '1'));
  const limit = 12;
  const isNe = lang === 'ne';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';

  setRequestLocale(lang);

  const author = await getAuthor(slug);
  if (!author || !author.is_active) notFound();

  const authorName = (isNe && author.name_ne) || author.name;
  const authorBio = (isNe && author.bio_ne) || author.bio;
  const authorCredentials = (isNe && author.credentials_ne) || author.credentials;
  const avatarUrl = author.avatar ? getImageUrl(author.avatar, 'blog') : undefined;
  const socialLinks = author.social_links as Record<string, string> | undefined;

  const [posts, total] = await Promise.all([
    prisma.blog_posts.findMany({
      where: { status: 'published', author_id: author.id, published_at: { not: null } },
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
      where: { status: 'published', author_id: author.id, published_at: { not: null } },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <AuthorJsonLd
        name={author.name}
        url={`${baseUrl}/${lang}/blog/author/${slug}`}
        image={avatarUrl || undefined}
        credentials={author.credentials || undefined}
        socialLinks={socialLinks}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: `${baseUrl}/${lang}` },
          { name: isNe ? 'ब्लग' : 'Blog', url: `${baseUrl}/${lang}/blog` },
          { name: authorName, url: `${baseUrl}/${lang}/blog/author/${slug}` },
        ]}
      />

      <div className="container-custom py-6 sm:py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          <a href={`/${lang}`} className="hover:text-rose-600">{isNe ? 'गृहपृष्ठ' : 'Home'}</a>
          <span className="mx-2">/</span>
          <a href={`/${lang}/blog`} className="hover:text-rose-600">{isNe ? 'ब्लग' : 'Blog'}</a>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{authorName}</span>
        </nav>

        {/* Author Profile Header */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {avatarUrl && (
              <Image
                src={avatarUrl}
                alt={authorName}
                width={96}
                height={96}
                className="rounded-full object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{authorName}</h1>
              {authorCredentials && (
                <p className="text-rose-600 font-medium mt-1">{authorCredentials}</p>
              )}
              {authorBio && (
                <p className="text-gray-600 mt-3 leading-relaxed">{authorBio}</p>
              )}
              {socialLinks && Object.keys(socialLinks).length > 0 && (
                <div className="flex gap-3 mt-4">
                  {Object.entries(socialLinks).map(([platform, url]) => (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-500 hover:text-rose-600 capitalize transition-colors"
                    >
                      {platform}
                    </a>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-500 mt-3">
                {total} {isNe ? 'लेखहरू' : total === 1 ? 'article' : 'articles'}
              </p>
            </div>
          </div>
        </div>

        {/* Posts */}
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {isNe ? `${authorName}का लेखहरू` : `Articles by ${authorName}`}
        </h2>

        {posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {posts.map(post => (
              <BlogCard key={post.id} post={post} lang={lang} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">
              {isNe ? 'कुनै लेख फेला परेन।' : 'No articles found.'}
            </p>
          </div>
        )}

        <BlogPagination
          currentPage={page}
          totalPages={totalPages}
          basePath={`/${lang}/blog/author/${slug}`}
        />
      </div>
    </>
  );
}

import { Metadata } from 'next';
import { cache } from 'react';
import { prisma } from '@thulobazaar/database';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import Image from 'next/image';
import { getImageUrl } from '@/lib/images/imageUrl';
import {
  AuthorCard,
  BlogCard,
  MarketplaceCTA,
  ShareButtons,
  TableOfContents,
  BlogPostJsonLd,
  BreadcrumbJsonLd,
} from '../components';

interface BlogPostPageProps {
  params: Promise<{ lang: string; slug: string }>;
}

const getPost = cache(async (slug: string) => {
  return prisma.blog_posts.findUnique({
    where: { slug },
    include: {
      blog_authors: true,
      blog_categories: true,
      blog_post_tags: {
        include: { blog_tags: true },
      },
    },
  });
});

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';
  const isNe = lang === 'ne';

  const post = await getPost(slug);
  if (!post || post.status !== 'published') {
    return { title: 'Post Not Found' };
  }

  const title = (isNe && post.title_ne) || post.title;
  const description = (isNe && post.meta_description_ne) || post.meta_description || (isNe && post.excerpt_ne) || post.excerpt || '';
  const imageUrl = post.featured_image ? getImageUrl(post.featured_image, 'blog') : undefined;
  const tags = post.blog_post_tags.map(pt => pt.blog_tags.name);

  return {
    title: `${title} - Thulo Bazaar`,
    description,
    keywords: tags,
    alternates: {
      canonical: `${baseUrl}/${lang}/blog/${slug}`,
      languages: { en: `${baseUrl}/en/blog/${slug}`, ne: `${baseUrl}/ne/blog/${slug}` },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${lang}/blog/${slug}`,
      siteName: 'Thulo Bazaar',
      ...(imageUrl && { images: [{ url: imageUrl, width: 1200, height: 630, alt: title }] }),
      locale: isNe ? 'ne_NP' : 'en_US',
      type: 'article',
      ...(post.published_at && { publishedTime: post.published_at.toISOString() }),
      ...(post.updated_at && { modifiedTime: post.updated_at.toISOString() }),
      authors: [post.blog_authors.name],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
}

// Content is authored by us (not user-generated), stored in our own database.
// This is the standard approach for rendering CMS rich text content.
function BlogContent({ html }: { html: string }) {
  return (
    <div
      className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-rose-600 hover:prose-a:text-rose-700 prose-img:rounded-lg"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { lang, slug } = await params;
  const isNe = lang === 'ne';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';

  setRequestLocale(lang);

  const post = await getPost(slug);
  if (!post || post.status !== 'published') notFound();

  // Increment view count (fire-and-forget)
  prisma.blog_posts.update({
    where: { id: post.id },
    data: { view_count: { increment: 1 } },
  }).catch(() => {});

  // Related posts
  const relatedPosts = await prisma.blog_posts.findMany({
    where: { status: 'published', category_id: post.category_id, id: { not: post.id } },
    select: {
      id: true, title: true, title_ne: true, slug: true,
      excerpt: true, excerpt_ne: true,
      featured_image: true, featured_image_alt: true, featured_image_alt_ne: true,
      reading_time_min: true, published_at: true,
      blog_authors: { select: { name: true, name_ne: true, slug: true, avatar: true } },
      blog_categories: { select: { name: true, name_ne: true, slug: true } },
    },
    orderBy: { published_at: 'desc' },
    take: 3,
  });

  const title = (isNe && post.title_ne) || post.title;
  const content = (isNe && post.content_ne) || post.content;
  const categoryName = (isNe && post.blog_categories.name_ne) || post.blog_categories.name;
  const tags = post.blog_post_tags.map(pt => pt.blog_tags);
  const imageUrl = post.featured_image ? getImageUrl(post.featured_image, 'blog') : undefined;
  const authorAvatarUrl = post.blog_authors.avatar ? getImageUrl(post.blog_authors.avatar, 'blog') : undefined;

  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString(isNe ? 'ne-NP' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '';

  const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;

  return (
    <>
      <BlogPostJsonLd
        title={title}
        description={post.meta_description || post.excerpt || ''}
        url={`${baseUrl}/${lang}/blog/${slug}`}
        imageUrl={imageUrl || undefined}
        publishedAt={post.published_at?.toISOString()}
        updatedAt={post.updated_at?.toISOString()}
        authorName={post.blog_authors.name}
        authorUrl={`${baseUrl}/${lang}/blog/author/${post.blog_authors.slug}`}
        authorImage={authorAvatarUrl || undefined}
        authorCredentials={post.blog_authors.credentials || undefined}
        authorSocialLinks={post.blog_authors.social_links as Record<string, string> | undefined}
        categoryName={categoryName}
        tags={tags.map(t => t.name)}
        wordCount={wordCount}
        lang={lang}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: `${baseUrl}/${lang}` },
          { name: isNe ? 'ब्लग' : 'Blog', url: `${baseUrl}/${lang}/blog` },
          { name: categoryName, url: `${baseUrl}/${lang}/blog/category/${post.blog_categories.slug}` },
          { name: title, url: `${baseUrl}/${lang}/blog/${slug}` },
        ]}
      />

      <article className="container-custom py-6 sm:py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-4">
          <a href={`/${lang}`} className="hover:text-rose-600">{isNe ? 'गृहपृष्ठ' : 'Home'}</a>
          <span className="mx-2">/</span>
          <a href={`/${lang}/blog`} className="hover:text-rose-600">{isNe ? 'ब्लग' : 'Blog'}</a>
          <span className="mx-2">/</span>
          <a href={`/${lang}/blog/category/${post.blog_categories.slug}`} className="hover:text-rose-600">{categoryName}</a>
        </nav>

        {/* Article Header */}
        <header className="max-w-3xl mb-8">
          <div className="flex items-center gap-3 mb-3">
            <a
              href={`/${lang}/blog/category/${post.blog_categories.slug}`}
              className="text-xs font-semibold text-rose-600 uppercase tracking-wide hover:text-rose-700"
            >
              {categoryName}
            </a>
            {post.reading_time_min && (
              <span className="text-xs text-gray-500">
                {post.reading_time_min} {isNe ? 'मिनेट पढ्ने' : 'min read'}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-4">
            {title}
          </h1>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {post.blog_authors.avatar && (
                <Image
                  src={authorAvatarUrl || '/placeholder-avatar.svg'}
                  alt={post.blog_authors.name}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              )}
              <div>
                <a
                  href={`/${lang}/blog/author/${post.blog_authors.slug}`}
                  className="text-sm font-medium text-gray-900 hover:text-rose-600"
                >
                  {(isNe && post.blog_authors.name_ne) || post.blog_authors.name}
                </a>
                {publishedDate && (
                  <p className="text-xs text-gray-500">{publishedDate}</p>
                )}
              </div>
            </div>
            <ShareButtons url={`${baseUrl}/${lang}/blog/${slug}`} title={title} />
          </div>
        </header>

        {/* Featured Image */}
        {imageUrl && (
          <div className="relative aspect-[16/9] max-w-3xl rounded-xl overflow-hidden mb-8">
            <Image
              src={imageUrl}
              alt={(isNe && post.featured_image_alt_ne) || post.featured_image_alt || title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        )}

        <div className="max-w-3xl">
          <TableOfContents
            content={content}
            label={isNe ? 'विषयसूची' : 'Table of Contents'}
          />

          <BlogContent html={content} />

          <MarketplaceCTA categorySlugs={post.linked_category_slugs} lang={lang} />

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-200">
              {tags.map(tag => (
                <a
                  key={tag.id}
                  href={`/${lang}/blog/tag/${tag.slug}`}
                  className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                >
                  #{(isNe && tag.name_ne) || tag.name}
                </a>
              ))}
            </div>
          )}

          {/* Author Card */}
          <div className="mt-8">
            <AuthorCard author={{...post.blog_authors, social_links: post.blog_authors.social_links as Record<string, string> | null}} lang={lang} />
          </div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {isNe ? 'सम्बन्धित लेखहरू' : 'Related Articles'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPosts.map(rp => (
                  <BlogCard key={rp.id} post={rp} lang={lang} />
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
    </>
  );
}

import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl } from '@/lib/images/imageUrl';

interface BlogCardProps {
  post: {
    title: string;
    title_ne?: string | null;
    slug: string;
    excerpt?: string | null;
    excerpt_ne?: string | null;
    featured_image?: string | null;
    featured_image_alt?: string | null;
    featured_image_alt_ne?: string | null;
    reading_time_min?: number | null;
    published_at?: Date | null;
    blog_authors?: {
      name: string;
      name_ne?: string | null;
      slug: string;
      avatar?: string | null;
    } | null;
    blog_categories?: {
      name: string;
      name_ne?: string | null;
      slug: string;
    } | null;
  };
  lang: string;
}

export default function BlogCard({ post, lang }: BlogCardProps) {
  const isNe = lang === 'ne';
  const title = (isNe && post.title_ne) || post.title;
  const excerpt = (isNe && post.excerpt_ne) || post.excerpt;
  const categoryName = (isNe && post.blog_categories?.name_ne) || post.blog_categories?.name;
  const authorName = (isNe && post.blog_authors?.name_ne) || post.blog_authors?.name;
  const imageAlt = (isNe && post.featured_image_alt_ne) || post.featured_image_alt || title;

  const imageUrl = post.featured_image
    ? getImageUrl(post.featured_image, 'blog') || '/placeholder-blog.svg'
    : '/placeholder-blog.svg';

  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString(isNe ? 'ne-NP' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <article className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <Link href={`/${lang}/blog/${post.slug}`} className="block">
        <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      </Link>

      <div className="p-4 sm:p-5">
        {categoryName && (
          <Link
            href={`/${lang}/blog/category/${post.blog_categories?.slug}`}
            className="inline-block text-xs font-semibold text-rose-600 uppercase tracking-wide mb-2 hover:text-rose-700"
          >
            {categoryName}
          </Link>
        )}

        <Link href={`/${lang}/blog/${post.slug}`}>
          <h2 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-rose-600 transition-colors">
            {title}
          </h2>
        </Link>

        {excerpt && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{excerpt}</p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            {post.blog_authors?.avatar && (
              <Image
                src={getImageUrl(post.blog_authors.avatar, 'blog') || '/placeholder-avatar.svg'}
                alt={authorName || ''}
                width={24}
                height={24}
                className="rounded-full object-cover"
              />
            )}
            <span>{authorName}</span>
          </div>
          <div className="flex items-center gap-3">
            {publishedDate && <time>{publishedDate}</time>}
            {post.reading_time_min && (
              <span>{post.reading_time_min} {isNe ? 'मिनेट' : 'min read'}</span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

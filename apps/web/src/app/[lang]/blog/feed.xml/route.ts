import { prisma } from '@thulobazaar/database';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lang: string }> }
) {
  const { lang } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';
  const isNe = lang === 'ne';

  const posts = await prisma.blog_posts.findMany({
    where: { status: 'published', published_at: { not: null } },
    include: {
      blog_authors: { select: { name: true } },
      blog_categories: { select: { name: true } },
    },
    orderBy: { published_at: 'desc' },
    take: 50,
  });

  const items = posts.map((post) => {
    const title = (isNe && post.title_ne) || post.title;
    const description = (isNe && post.excerpt_ne) || post.excerpt || post.meta_description || '';
    const pubDate = post.published_at ? new Date(post.published_at).toUTCString() : '';

    return `    <item>
      <title><![CDATA[${title}]]></title>
      <link>${baseUrl}/${lang}/blog/${post.slug}</link>
      <guid isPermaLink="true">${baseUrl}/${lang}/blog/${post.slug}</guid>
      <description><![CDATA[${description}]]></description>
      <pubDate>${pubDate}</pubDate>
      ${post.blog_authors?.name ? `<author>${post.blog_authors.name}</author>` : ''}
      ${post.blog_categories?.name ? `<category>${post.blog_categories.name}</category>` : ''}
    </item>`;
  });

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Thulo Bazaar Blog${isNe ? ' (नेपाली)' : ''}</title>
    <link>${baseUrl}/${lang}/blog</link>
    <description>Latest articles and guides from Thulo Bazaar</description>
    <language>${lang === 'ne' ? 'ne' : 'en'}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/${lang}/blog/feed.xml" rel="self" type="application/rss+xml"/>
${items.join('\n')}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

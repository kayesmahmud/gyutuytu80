import { ImageResponse } from 'next/og';
import { prisma } from '@thulobazaar/database';

export const alt = 'Thulo Bazaar Blog';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const isNe = lang === 'ne';

  const post = await prisma.blog_posts.findUnique({
    where: { slug },
    select: {
      title: true,
      title_ne: true,
      blog_authors: { select: { name: true } },
      blog_categories: { select: { name: true } },
    },
  });

  const title = (isNe && post?.title_ne) || post?.title || slug.replace(/-/g, ' ');
  const author = post?.blog_authors?.name || 'Thulo Bazaar';
  const category = post?.blog_categories?.name || 'Blog';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)',
          padding: '60px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Top: Category badge */}
        <div style={{ display: 'flex' }}>
          <div
            style={{
              background: '#6366f1',
              color: 'white',
              padding: '8px 24px',
              borderRadius: '20px',
              fontSize: '20px',
              fontWeight: 600,
            }}
          >
            {category}
          </div>
        </div>

        {/* Middle: Title */}
        <div
          style={{
            color: 'white',
            fontSize: title.length > 50 ? '42px' : '52px',
            fontWeight: 'bold',
            lineHeight: 1.3,
            maxHeight: '220px',
            overflow: 'hidden',
          }}
        >
          {title.length > 90 ? title.substring(0, 87) + '...' : title}
        </div>

        {/* Bottom: Author & Branding */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '22px',
                background: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '20px',
                fontWeight: 'bold',
              }}
            >
              {author.charAt(0).toUpperCase()}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '24px' }}>{author}</div>
          </div>
          <div style={{ color: '#94a3b8', fontSize: '24px', fontWeight: 'bold' }}>
            Thulo Bazaar
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

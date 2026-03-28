import { ImageResponse } from 'next/og';
import { prisma } from '@thulobazaar/database';

export const alt = 'Thulo Bazaar - Ad';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { slug } = await params;

  const ad = await prisma.ads.findFirst({
    where: { slug, deleted_at: null },
    select: {
      title: true,
      price: true,
      condition: true,
      categories: { select: { name: true } },
    },
  });

  const title = ad?.title || slug.replace(/-/g, ' ');
  const price = ad?.price ? `Rs. ${parseFloat(ad.price.toString()).toLocaleString()}` : 'Price on Request';
  const category = ad?.categories?.name || '';
  const condition = ad?.condition || '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)',
          padding: '60px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Top: Category & Condition */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {category && (
            <div
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                padding: '8px 20px',
                borderRadius: '20px',
                fontSize: '22px',
              }}
            >
              {category}
            </div>
          )}
          {condition && (
            <div
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                padding: '8px 20px',
                borderRadius: '20px',
                fontSize: '22px',
              }}
            >
              {condition}
            </div>
          )}
        </div>

        {/* Middle: Title */}
        <div
          style={{
            color: 'white',
            fontSize: title.length > 60 ? '40px' : '52px',
            fontWeight: 'bold',
            lineHeight: 1.2,
            maxHeight: '200px',
            overflow: 'hidden',
          }}
        >
          {title.length > 80 ? title.substring(0, 77) + '...' : title}
        </div>

        {/* Bottom: Price & Branding */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div
            style={{
              color: '#86efac',
              fontSize: '56px',
              fontWeight: 'bold',
            }}
          >
            {price}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', opacity: 0.9 }}>
              Thulo Bazaar
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

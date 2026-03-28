import { ImageResponse } from 'next/og';

export const alt = 'Thulo Bazaar - Buy & Sell Everything in Nepal';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: '72px',
            fontWeight: 'bold',
            marginBottom: '16px',
          }}
        >
          Thulo Bazaar
        </div>
        <div
          style={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: '32px',
            fontWeight: 500,
          }}
        >
          Nepal&apos;s Leading Classifieds Marketplace
        </div>
        <div
          style={{
            color: 'rgba(255,255,255,0.65)',
            fontSize: '24px',
            marginTop: '24px',
          }}
        >
          Buy &amp; Sell Everything
        </div>
      </div>
    ),
    { ...size }
  );
}

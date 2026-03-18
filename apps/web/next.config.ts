import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  poweredByHeader: false,
  // Skip TS checking during build — handled separately in CI via tsc --noEmit
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ['@thulobazaar/types', '@thulobazaar/utils', '@thulobazaar/api-client'],
  // Allow dev requests from network IP for mobile testing
  allowedDevOrigins: ['192.168.0.114'],
  // Empty turbopack config to silence Next.js 16 warning about webpack config
  // This allows us to keep using webpack config while acknowledging Turbopack is available
  turbopack: {},
  // Webpack config to handle Node.js modules in pg adapter (Prisma 7)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve?.fallback,
          net: false,
          dns: false,
          tls: false,
          fs: false,
          'pg-native': false,
        },
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      // Local development
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.0.114',
        port: '5000',
        pathname: '/uploads/**',
      },
      // Production: API domain serves uploads
      ...(process.env.NEXT_PUBLIC_API_HOSTNAME ? [{
        protocol: 'https' as const,
        hostname: process.env.NEXT_PUBLIC_API_HOSTNAME,
        pathname: '/uploads/**',
      }] : []),
      // Unsplash (blog featured images)
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      // Lorem Picsum (blog placeholder images)
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fastly.picsum.photos',
        pathname: '/**',
      },
      // OAuth providers
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'platform-lookaside.fbsbx.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'graph.facebook.com',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const isDev = process.env.NODE_ENV === 'development';

    const csp = [
      "default-src 'self'",
      // 'unsafe-inline' required for Next.js hydration; 'unsafe-eval' only in dev (React DevTools)
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://pagead2.googlesyndication.com https://www.googletagmanager.com https://accounts.google.com https://connect.facebook.net`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      `img-src 'self' data: blob: https: ${isDev ? 'http://localhost:5000 http://192.168.0.114:5000' : ''}`.trim(),
      // API fetch + Socket.IO WebSocket connections
      `connect-src 'self' ${apiUrl} ws: wss: https://accounts.google.com`,
      "frame-src https://accounts.google.com https://www.facebook.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://rc-epay.esewa.com.np https://epay.esewa.com.np https://dev.khalti.com https://khalti.com",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/en',
        permanent: true,
      },
      // Redirect old /all-ads route to /ads
      {
        source: '/:lang/all-ads',
        destination: '/:lang/ads',
        permanent: true,
      },
      // Redirect old /search route to /ads (with query params preserved)
      {
        source: '/:lang/search',
        destination: '/:lang/ads',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    return [
      {
        source: '/uploads/:path*',
        destination: `${apiUrl}/uploads/:path*`,
      },
    ];
  },
}

export default withNextIntl(nextConfig)

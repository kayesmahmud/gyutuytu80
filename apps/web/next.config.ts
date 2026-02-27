import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
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

export default nextConfig

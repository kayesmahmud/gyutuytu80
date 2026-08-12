import { MetadataRoute } from 'next';

// Private areas, named without their locale segment.
// Every app route is locale-prefixed (/en/dashboard, /ne/dashboard), so a bare
// "/dashboard/" rule matches nothing at all.
const PRIVATE_PATHS = [
  'dashboard',
  'editor',
  'super-admin',
  'profile',
  'post-ad',
  'edit-ad',
  'notifications',
  'messages',
  'verification',
  'payment',
  'auth',
];

const LOCALES = ['en', 'ne'];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';

  // Emit both the explicit per-locale form and an unprefixed form, so the rules
  // still hold if a path is ever reached without a locale segment.
  const localisedDisallows = PRIVATE_PATHS.flatMap((path) => [
    `/${path}/`,
    ...LOCALES.map((lang) => `/${lang}/${path}/`),
  ]);

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          ...localisedDisallows,
          '/*?promoted=*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

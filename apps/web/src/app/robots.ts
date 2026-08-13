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

// Crawlers that collect content to train models. Blocking them costs no traffic
// — they don't send visitors — so we keep the listings out of training corpora.
//
// Note what is deliberately NOT here: OAI-SearchBot, ChatGPT-User, PerplexityBot
// and Claude-User are AI *search* agents that do send real visitors (OpenAI
// alone: 876 requests/24h, +156%, 474 of them ChatGPT-User). They stay allowed
// by the '*' rule above.
//
// Google-Extended is also deliberately absent: it gates whether listings can
// appear in Google AI Overviews, which render at the top of ordinary search
// results. It has no bearing on normal Googlebot ranking — that's a separate
// agent — so blocking it only costs visibility.
const AI_TRAINING_CRAWLERS = [
  'GPTBot',
  'ClaudeBot',
  'CCBot',
  'Applebot-Extended',
  'meta-externalagent',
  'Bytespider',
  'Amazonbot',
];

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
      // These only take effect once Cloudflare's "Managed robots.txt" toggle
      // (AI Crawl Control) is OFF. While it is on, Cloudflare appends its own
      // block to this file and its Google-Extended disallow would still apply.
      {
        userAgent: AI_TRAINING_CRAWLERS,
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

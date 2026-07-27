/**
 * Analytics container IDs, resolved at request time.
 *
 * SERVER ONLY — import this from Server Components (app/layout.tsx) and pass
 * the values down as props. Do not import it from a client component.
 *
 * Deliberately NOT using `NEXT_PUBLIC_*`: Next.js inlines those at build time,
 * so swapping a pixel would still require a rebuild and redeploy. Reading plain
 * server env vars here means changing an ID is `.env` edit + container restart,
 * with no rebuild and no code change.
 *
 * Both fall back to the IDs that were previously hardcoded, so an unset or
 * missing env var degrades to today's behaviour rather than silently switching
 * tracking off mid-campaign.
 */

const DEFAULT_GTM_CONTAINER_ID = 'GTM-NDZQCRKC';
const DEFAULT_META_PIXEL_ID = '988432024000859';

export interface AnalyticsConfig {
  gtmId: string | null;
  metaPixelId: string | null;
}

/** Treat empty/whitespace as unset; the literal "off" disables a tag entirely. */
function resolve(value: string | undefined, fallback: string): string | null {
  const trimmed = value?.trim();
  if (trimmed === undefined || trimmed === '') return fallback;
  return trimmed.toLowerCase() === 'off' ? null : trimmed;
}

export function getAnalyticsConfig(): AnalyticsConfig {
  return {
    gtmId: resolve(process.env.GTM_CONTAINER_ID, DEFAULT_GTM_CONTAINER_ID),
    metaPixelId: resolve(process.env.META_PIXEL_ID, DEFAULT_META_PIXEL_ID),
  };
}

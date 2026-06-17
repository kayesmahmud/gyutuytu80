/**
 * Single source of truth for generating a user's shop_slug.
 *
 * Background: this exact logic was previously copy-pasted inline in 3 places
 * (phone register, Passport Google, mobile OAuth) and FORGOTTEN in 2 others
 * (mobile verifyGoogleToken / verifyAppleToken) — which left Google/Apple
 * mobile signups with a NULL shop_slug and therefore no shop URL. Centralizing
 * here so every user-creation path stays in sync.
 *
 * Slug shape: `${sanitized-name}-${userId}`. Appending the unique userId means
 * the result is always unique, so no collision handling is needed.
 */
export function generateShopSlug(name: string, userId: number): string {
  const baseSlug = (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // strips ANYTHING non-ASCII — incl. Devanagari
    .replace(/\s+/g, '-')
    .substring(0, 50);

  // Fallback when baseSlug comes out empty (e.g. a pure-Devanagari name like
  // "राम बहादुर", whose every character the regex above strips). Without this the
  // slug would degrade to "-112" — a public URL starting with a dash that leaks
  // the raw id. We fall back to "user", giving "user-112", which the shop lookup
  // route already special-cases via its ^user-(\d+)$ pattern (shop.routes.ts).
  const safeBase = baseSlug || 'user';

  return `${safeBase}-${userId}`;
}

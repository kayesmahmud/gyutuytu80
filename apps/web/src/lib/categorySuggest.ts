import type { CategoryKeyword } from '@thulobazaar/types';

/**
 * Keyword→category matcher for post-ad title suggestions.
 * Contract (mirrored by the Flutter implementation — keep in sync):
 * - lowercase, punctuation → spaces, word-boundary phrase match
 * - longest matching keyword wins
 * - \p{M} must stay in the keep-class or Devanagari vowel signs get stripped
 */
export function normalizeTitle(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function suggestCategory(
  title: string,
  keywords: CategoryKeyword[]
): CategoryKeyword | null {
  const norm = normalizeTitle(title);
  if (norm.length < 3) return null;
  const normalized = ` ${norm} `;

  let best: CategoryKeyword | null = null;
  for (const entry of keywords) {
    if (
      normalized.includes(` ${entry.keyword} `) &&
      (!best || entry.keyword.length > best.keyword.length)
    ) {
      best = entry;
    }
  }
  return best;
}

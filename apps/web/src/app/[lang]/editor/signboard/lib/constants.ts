/**
 * The signboard's fixed brand identity.
 *
 * Nothing in this file is user-configurable by design — the generator is a
 * controlled branding tool, not a design editor. Staff choose the shop name,
 * the shop URL and the dimensions; everything else is locked down here.
 */

/** Sampled from the official logo artwork, not eyeballed. */
export const SIGNBOARD_RED = '#DC143C';
export const SIGNBOARD_WHITE = '#FFFFFF';

/**
 * The one-line white wordmark. Drop a replacement at this path and the renderer
 * picks it up — it measures the file's intrinsic size at load rather than
 * assuming an aspect ratio, so a new logo can never come out stretched.
 * Built by `scripts/build-signboard-wordmark.py`.
 */
export const WORDMARK_SRC = '/assets/signboard/wordmark-horizontal-white.png';

export const LEAD_IN_TEXT = 'We are in';
export const VISIT_LABEL = 'Visit us:';

/** Weights used on the signboard itself. Inter ships as a variable font here. */
export const WEIGHT_LEAD_IN = 700;
export const WEIGHT_SHOP_NAME = 800;
export const WEIGHT_VISIT = 700;

export const FALLBACK_FONT_STACK = 'system-ui, -apple-system, sans-serif';

/**
 * Reads the font family Next actually resolved for `next/font`. The generated
 * family name is hashed (`__Inter_e8ce0c`), so a canvas asking for plain
 * "Inter" would silently fall back to a different typeface — and the export
 * would not match the preview.
 */
export function resolveFontFamily(): string {
  if (typeof window === 'undefined') return FALLBACK_FONT_STACK;
  const resolved = getComputedStyle(document.body).fontFamily;
  return resolved || FALLBACK_FONT_STACK;
}

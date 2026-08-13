/**
 * The signboard renderer.
 *
 * This is the single drawing path for the whole feature: the on-screen preview
 * and the print-resolution export both call `drawSignboard`, differing only in
 * the canvas size passed in. Layout is entirely proportional, so what staff
 * approve on screen is what the printer receives.
 *
 * Deliberately free of React and of DOM lookups beyond the canvas itself, so a
 * future bulk generator or API route can reuse it unchanged.
 */

import {
  LEAD_IN_TEXT,
  SIGNBOARD_RED,
  SIGNBOARD_WHITE,
  VISIT_LABEL,
  WEIGHT_LEAD_IN,
  WEIGHT_SHOP_NAME,
  WEIGHT_VISIT,
  WORDMARK_SRC,
} from './constants';
import {
  computeLayout,
  type ShopRegion,
  type SignboardLayout,
  type SignboardLayoutId,
  type TextSlot,
} from './layoutEngine';
import { fitText, fontString, type TextFit } from './textFitting';

export interface SignboardContent {
  shopName: string;
  shopUrl: string;
}

export interface RenderReport {
  layout: SignboardLayout;
  /** Font sizes as a fraction of canvas height, so callers can convert them to
   *  physical inches and judge whether the print will actually be readable. */
  shopNameFontRatio: number;
  visitFontRatio: number;
  shopNameLines: number;
}

/** Uppercase display text wants tighter leading than body copy. */
const SHOP_NAME_LINE_HEIGHT = 1.08;
const SINGLE_LINE = 1;
const SHOP_NAME_MAX_LINES = 2;

/**
 * A shop name stays on one line unless doing so shrinks it below this share of
 * the size the slot allows. Wrapping always buys a larger font, so without a
 * rule like this every two-word name would wrap — and the reference artwork puts
 * the trading name on a single line.
 */
const WRAP_BELOW_SINGLE_LINE_SHARE = 0.6;

export function wordmarkAspect(image: ImageBitmap | HTMLImageElement): number {
  return image.width / image.height;
}

export async function loadWordmark(): Promise<ImageBitmap> {
  const response = await fetch(WORDMARK_SRC);
  if (!response.ok) {
    throw new Error(`Could not load the signboard wordmark (${response.status}).`);
  }
  return createImageBitmap(await response.blob());
}

/**
 * Canvas silently substitutes a different typeface for one that has not loaded
 * yet, which would make an export disagree with the preview. Waiting on the
 * exact weights we draw with removes that race.
 */
export async function ensureSignboardFonts(fontFamily: string): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  const weights = [WEIGHT_LEAD_IN, WEIGHT_SHOP_NAME, WEIGHT_VISIT];
  await Promise.all(
    weights.map((weight) => document.fonts.load(fontString(weight, 64, fontFamily)))
  );
  await document.fonts.ready;
}

/** Draws a fitted block with the top of its real ink at `inkTop`. */
function drawAt(
  ctx: CanvasRenderingContext2D,
  fit: TextFit,
  x: number,
  inkTop: number,
  align: CanvasTextAlign,
  weight: number,
  fontFamily: string
): void {
  ctx.font = fontString(weight, fit.fontSize, fontFamily);
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = SIGNBOARD_WHITE;

  let baseline = inkTop + fit.ascent;
  for (const line of fit.lines) {
    ctx.fillText(line, x, baseline);
    baseline += fit.lineStep;
  }
}

/** Centres a fitted block on its real ink inside a slot. */
function drawBlock(
  ctx: CanvasRenderingContext2D,
  fit: TextFit,
  slot: TextSlot,
  weight: number,
  fontFamily: string
): void {
  const inkTop = slot.y + (slot.height - fit.inkHeight) / 2;
  drawAt(ctx, fit, slot.x, inkTop, slot.align, weight, fontFamily);
}

/**
 * Fits the shop name, keeping it on one line unless that would make it too
 * small to be worth it.
 */
function fitShopName(
  ctx: CanvasRenderingContext2D,
  text: string,
  region: ShopRegion,
  fontFamily: string
): TextFit {
  const maxFontSize = Math.min(region.nameMaxHeight, region.maxNameFontSize);
  const base = {
    text,
    maxWidth: region.width,
    maxHeight: region.nameMaxHeight,
    weight: WEIGHT_SHOP_NAME,
    fontFamily,
    maxFontSize,
    lineHeight: SHOP_NAME_LINE_HEIGHT,
  };

  const single = fitText(ctx, { ...base, maxLines: SINGLE_LINE });
  if (single.fontSize >= maxFontSize * WRAP_BELOW_SINGLE_LINE_SHARE) return single;

  const wrapped = fitText(ctx, { ...base, maxLines: SHOP_NAME_MAX_LINES });
  return wrapped.fontSize > single.fontSize ? wrapped : single;
}

export interface DrawOptions {
  width: number;
  height: number;
  content: SignboardContent;
  wordmark: ImageBitmap | HTMLImageElement;
  fontFamily: string;
  layoutId: SignboardLayoutId;
}

export function drawSignboard(
  ctx: CanvasRenderingContext2D,
  { width, height, content, wordmark, fontFamily, layoutId }: DrawOptions
): RenderReport {
  const layout = computeLayout(width, height, wordmarkAspect(wordmark), layoutId);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = SIGNBOARD_RED;
  ctx.fillRect(0, 0, width, height);

  // The wordmark box already carries the image's own aspect ratio, so this can
  // never stretch the logo.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    wordmark,
    layout.wordmark.x,
    layout.wordmark.y,
    layout.wordmark.width,
    layout.wordmark.height
  );

  const leadInFit = fitText(ctx, {
    text: LEAD_IN_TEXT,
    maxWidth: layout.leadIn.width,
    maxHeight: layout.leadIn.height,
    weight: WEIGHT_LEAD_IN,
    fontFamily,
    maxFontSize: layout.leadIn.height,
    maxLines: SINGLE_LINE,
    lineHeight: SINGLE_LINE,
  });
  drawBlock(ctx, leadInFit, layout.leadIn, WEIGHT_LEAD_IN, fontFamily);

  const { shop } = layout;
  const shopNameFit = fitShopName(ctx, content.shopName, shop, fontFamily);

  // Sized against what the name actually landed on, so the link stays subordinate
  // to it whether the name came out large or was squeezed down.
  const visitFit = fitText(ctx, {
    text: `${VISIT_LABEL} ${content.shopUrl}`,
    maxWidth: shop.width,
    maxHeight: shop.urlMaxHeight,
    weight: WEIGHT_VISIT,
    fontFamily,
    maxFontSize: Math.min(shop.urlMaxHeight, shopNameFit.fontSize * shop.urlOfNameFontSize),
    maxLines: SINGLE_LINE,
    lineHeight: SINGLE_LINE,
  });

  // Positioned on the pair's combined ink so the block sits level with the
  // wordmark instead of drifting inside oversized boxes.
  const blockHeight = shopNameFit.inkHeight + shop.gap + visitFit.inkHeight;
  const blockTop =
    shop.verticalAnchor === 'bottom'
      ? shop.y + shop.height - blockHeight
      : shop.y + (shop.height - blockHeight) / 2;

  drawAt(ctx, shopNameFit, shop.x, blockTop, shop.align, WEIGHT_SHOP_NAME, fontFamily);
  drawAt(
    ctx,
    visitFit,
    shop.x,
    blockTop + shopNameFit.inkHeight + shop.gap,
    shop.align,
    WEIGHT_VISIT,
    fontFamily
  );

  return {
    layout,
    shopNameFontRatio: shopNameFit.fontSize / height,
    visitFontRatio: visitFit.fontSize / height,
    shopNameLines: shopNameFit.lines.length,
  };
}

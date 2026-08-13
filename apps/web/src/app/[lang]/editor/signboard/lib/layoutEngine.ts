/**
 * Signboard layout engine.
 *
 * Produces the slot geometry for one signboard in one of two approved
 * compositions. Every number below is a fraction of the canvas, so the same
 * layout is correct at preview resolution and at print resolution — the preview
 * cannot drift from the export by construction.
 *
 * The engine hands back empty boxes only; it never measures or draws text. The
 * renderer fits text into these boxes, which keeps "how big is the shop name" in
 * exactly one place (textFitting) instead of two.
 *
 * Proportions were measured off the approved reference artwork for each layout.
 */

export type SignboardLayoutId = 'side-by-side' | 'stacked';

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A text box plus its anchor. `x` is the anchor the alignment measures from —
 * the left edge for `left`, the right edge for `right` — while `width` stays the
 * space available for fitting, independent of which way the text grows.
 */
export interface TextSlot extends Box {
  align: CanvasTextAlign;
}

/**
 * The shop name and its link, as one region rather than two fixed boxes.
 *
 * The renderer stacks the fitted text inside this region and centres the pair on
 * their real ink. Giving each line its own tall box instead makes short text
 * float away from the wordmark it is supposed to sit beside.
 */
export interface ShopRegion extends TextSlot {
  /**
   * How the fitted pair sits in the region. `bottom` lines the foot of the link
   * up with the foot of the wordmark, which is the alignment the reference
   * artwork uses — centring the two columns independently lets them drift.
   */
  verticalAnchor: 'center' | 'bottom';
  /** Space between the shop name and the link. */
  gap: number;
  /** Ceiling on the shop name, so a short name never out-shouts the brand. */
  maxNameFontSize: number;
  nameMaxHeight: number;
  urlMaxHeight: number;
  /** Link size as a share of the size the name actually landed on, which keeps
   *  the hierarchy intact whether the name ended up large or tiny. */
  urlOfNameFontSize: number;
}

export interface SignboardLayout {
  id: SignboardLayoutId;
  wordmark: Box;
  leadIn: TextSlot;
  shop: ShopRegion;
}

export interface LayoutOption {
  id: SignboardLayoutId;
  label: string;
  description: string;
  /** Widest board this composition is intended for, in feet. */
  bestUpToFeet: number | null;
}

export const LAYOUT_OPTIONS: LayoutOption[] = [
  {
    id: 'side-by-side',
    label: 'Side by side',
    description: 'Logo on the left, shop name and link on the right.',
    bestUpToFeet: null,
  },
  {
    id: 'stacked',
    label: 'Stacked',
    description: 'Full-width logo with the shop name and link underneath.',
    bestUpToFeet: 5,
  },
];

/** Above this width the stacked composition leaves too much empty space. */
export const STACKED_BEST_MAX_WIDTH_FEET = 5;

const SIDE_BY_SIDE = {
  padXFraction: 0.045,
  padXFloorOfHeight: 0.08,
  padYFraction: 0.1,
  /** Wordmark share of the usable width. */
  brandShare: 0.58,
  columnGapShare: 0.07,
  maxWordmarkHeight: 0.46,
  leadInSizeOfWordmark: 0.34,
  leadInGapOfWordmark: 0.1,
  shopNameHeight: 0.46,
  shopGap: 0.07,
  visitHeight: 0.22,
  /** Measured off the reference: the shop name reads about half the height of
   *  the wordmark's capitals, never level with it. */
  maxShopNameOfWordmark: 0.58,
  urlOfNameFontSize: 0.45,
} as const;

const STACKED = {
  padXFraction: 0.075,
  padYFraction: 0.11,
  /** The wordmark spans the full usable width unless that makes it too tall. */
  maxWordmarkHeight: 0.4,
  leadInSizeOfWordmark: 0.5,
  leadInGapOfWordmark: 0.04,
  shopNameHeight: 0.2,
  blockGap: 0.07,
  visitHeight: 0.13,
  maxShopNameOfWordmark: 0.6,
  urlOfNameFontSize: 0.62,
} as const;

function sideBySideLayout(
  width: number,
  height: number,
  wordmarkAspect: number
): SignboardLayout {
  const padX = Math.max(width * SIDE_BY_SIDE.padXFraction, height * SIDE_BY_SIDE.padXFloorOfHeight);
  const padY = height * SIDE_BY_SIDE.padYFraction;
  const availWidth = width - padX * 2;
  const availHeight = height - padY * 2;

  // Size the wordmark from its width budget, then hold it back if that would
  // make it too tall for the board. Either way it keeps its own aspect ratio.
  let wordmarkWidth = availWidth * SIDE_BY_SIDE.brandShare;
  let wordmarkHeight = wordmarkWidth / wordmarkAspect;
  const maxWordmarkHeight = availHeight * SIDE_BY_SIDE.maxWordmarkHeight;
  if (wordmarkHeight > maxWordmarkHeight) {
    wordmarkHeight = maxWordmarkHeight;
    wordmarkWidth = wordmarkHeight * wordmarkAspect;
  }

  const leadInSize = wordmarkHeight * SIDE_BY_SIDE.leadInSizeOfWordmark;
  const leadInGap = wordmarkHeight * SIDE_BY_SIDE.leadInGapOfWordmark;

  // Centre the brand column (lead-in + wordmark) as a single block.
  const brandHeight = leadInSize + leadInGap + wordmarkHeight;
  const brandTop = padY + (availHeight - brandHeight) / 2;

  const columnGap = availWidth * SIDE_BY_SIDE.columnGapShare;
  const shopX = padX + wordmarkWidth + columnGap;
  const shopWidth = availWidth - wordmarkWidth - columnGap;

  const nameMaxHeight = availHeight * SIDE_BY_SIDE.shopNameHeight;
  const urlMaxHeight = availHeight * SIDE_BY_SIDE.visitHeight;
  const shopGap = availHeight * SIDE_BY_SIDE.shopGap;
  const shopHeight = nameMaxHeight + shopGap + urlMaxHeight;

  const wordmarkTop = brandTop + leadInSize + leadInGap;
  const wordmarkBottom = wordmarkTop + wordmarkHeight;

  return {
    id: 'side-by-side',
    leadIn: { x: padX, y: brandTop, width: wordmarkWidth, height: leadInSize, align: 'left' },
    wordmark: {
      x: padX,
      y: wordmarkTop,
      width: wordmarkWidth,
      height: wordmarkHeight,
    },
    shop: {
      x: shopX,
      // Region foot sits on the wordmark's foot, so the link's baseline lands
      // level with the bottom of the logo however the text ends up sized.
      y: wordmarkBottom - shopHeight,
      width: shopWidth,
      height: shopHeight,
      align: 'left',
      verticalAnchor: 'bottom',
      gap: shopGap,
      maxNameFontSize: wordmarkHeight * SIDE_BY_SIDE.maxShopNameOfWordmark,
      nameMaxHeight,
      urlMaxHeight,
      urlOfNameFontSize: SIDE_BY_SIDE.urlOfNameFontSize,
    },
  };
}

function stackedLayout(
  width: number,
  height: number,
  wordmarkAspect: number
): SignboardLayout {
  const padX = width * STACKED.padXFraction;
  const padY = height * STACKED.padYFraction;
  const availWidth = width - padX * 2;
  const availHeight = height - padY * 2;
  const rightEdge = padX + availWidth;

  let wordmarkWidth = availWidth;
  let wordmarkHeight = wordmarkWidth / wordmarkAspect;
  const maxWordmarkHeight = availHeight * STACKED.maxWordmarkHeight;
  if (wordmarkHeight > maxWordmarkHeight) {
    wordmarkHeight = maxWordmarkHeight;
    wordmarkWidth = wordmarkHeight * wordmarkAspect;
  }

  const leadInSize = wordmarkHeight * STACKED.leadInSizeOfWordmark;
  const leadInGap = wordmarkHeight * STACKED.leadInGapOfWordmark;
  const nameMaxHeight = availHeight * STACKED.shopNameHeight;
  const urlMaxHeight = availHeight * STACKED.visitHeight;
  const blockGap = availHeight * STACKED.blockGap;
  const shopHeight = nameMaxHeight + blockGap + urlMaxHeight;

  const totalHeight = leadInSize + leadInGap + wordmarkHeight + blockGap + shopHeight;
  let cursor = padY + (availHeight - totalHeight) / 2;

  const leadIn: TextSlot = {
    x: padX,
    y: cursor,
    width: availWidth,
    height: leadInSize,
    align: 'left',
  };
  cursor += leadInSize + leadInGap;

  const wordmark: Box = { x: padX, y: cursor, width: wordmarkWidth, height: wordmarkHeight };
  cursor += wordmarkHeight + blockGap;

  return {
    id: 'stacked',
    leadIn,
    wordmark,
    // Shop name and link hang off the right edge, under the end of the wordmark.
    shop: {
      x: rightEdge,
      y: cursor,
      width: availWidth,
      height: shopHeight,
      align: 'right',
      verticalAnchor: 'center',
      gap: blockGap,
      maxNameFontSize: wordmarkHeight * STACKED.maxShopNameOfWordmark,
      nameMaxHeight,
      urlMaxHeight,
      urlOfNameFontSize: STACKED.urlOfNameFontSize,
    },
  };
}

export function computeLayout(
  width: number,
  height: number,
  wordmarkAspect: number,
  id: SignboardLayoutId
): SignboardLayout {
  return id === 'stacked'
    ? stackedLayout(width, height, wordmarkAspect)
    : sideBySideLayout(width, height, wordmarkAspect);
}

/** The composition we suggest for a given board width, in feet. */
export function recommendedLayout(widthFeet: number): SignboardLayoutId {
  return widthFeet <= STACKED_BEST_MAX_WIDTH_FEET ? 'stacked' : 'side-by-side';
}

import {
  INCHES_PER_FOOT,
  MAX_HEIGHT_IN,
  MAX_WIDTH_IN,
  MIN_HEIGHT_IN,
  MIN_WIDTH_IN,
  formatFeet,
  toInches,
  type PhysicalSize,
} from './dimensions';
import { SHOP_URL_DOMAIN, type FieldErrors, type SignboardFormState } from '../types';

/**
 * Returns the requested size, or null when either field is not a usable number.
 * Parsing is kept separate from validation so the live preview can keep drawing
 * off the last good size while someone is mid-keystroke.
 */
export function parseSize(form: SignboardFormState): PhysicalSize | null {
  const width = Number(form.width);
  const height = Number(form.height);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  if (width <= 0 || height <= 0) return null;

  return {
    widthIn: toInches(width, form.widthUnit),
    heightIn: toInches(height, form.heightUnit),
  };
}

function validateEdge(
  raw: string,
  unit: SignboardFormState['widthUnit'],
  minIn: number,
  maxIn: number,
  label: 'width' | 'height'
): string | undefined {
  if (!raw.trim()) return `Please enter a ${label}.`;

  const value = Number(raw);
  if (!Number.isFinite(value)) return `Please enter a valid ${label}.`;
  if (value <= 0) return `The ${label} must be greater than zero.`;

  const inches = toInches(value, unit);
  if (inches < minIn) {
    return label === 'height'
      ? `Minimum height is ${formatFeet(minIn)} — signboard printers will not go shorter.`
      : `Minimum width is ${formatFeet(minIn)}.`;
  }
  if (inches > maxIn) {
    return label === 'width'
      ? `Maximum width is ${formatFeet(maxIn)} — these are shopfront signboards.`
      : `Maximum height is ${formatFeet(maxIn)}.`;
  }
  return undefined;
}

export function validateForm(form: SignboardFormState): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.shopName.trim()) errors.shopName = 'Shop name is required.';

  const shopUrl = form.shopUrl.trim();
  if (!shopUrl) {
    errors.shopUrl = 'Shop URL is required.';
  } else if (!shopUrl.toLowerCase().includes(SHOP_URL_DOMAIN)) {
    // The page is public, so without this anyone could put an unrelated link on
    // a board carrying our logo.
    errors.shopUrl = `The link must be your ${SHOP_URL_DOMAIN} shop link.`;
  }

  const width = validateEdge(form.width, form.widthUnit, MIN_WIDTH_IN, MAX_WIDTH_IN, 'width');
  if (width) errors.width = width;

  const height = validateEdge(form.height, form.heightUnit, MIN_HEIGHT_IN, MAX_HEIGHT_IN, 'height');
  if (height) errors.height = height;

  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Roughly the smallest capital letter that still reads from across a street.
 * The signage rule of thumb is one inch of letter height per 10 ft of viewing
 * distance; a shopfront is read from ~20-30 ft, so we flag anything under 2 in.
 */
export const MIN_READABLE_CAP_INCHES = 2;
/** Inter's cap height is 0.727 em, so cap height is a fraction of font size. */
const CAP_HEIGHT_RATIO = 0.727;

/** A link is read from closer than a shop name, so it can be smaller. */
export const MIN_READABLE_URL_CAP_INCHES = 0.75;

/**
 * Warns when long text has been shrunk so far that it will be hard to read on
 * the finished board. Nothing is blocked — text is never truncated — so this is
 * guidance for staff, who may prefer a wider board or the other layout.
 */
export function readabilityWarning(
  shopNameFontRatio: number,
  urlFontRatio: number,
  size: PhysicalSize
): string | null {
  const nameCap = shopNameFontRatio * size.heightIn * CAP_HEIGHT_RATIO;
  const urlCap = urlFontRatio * size.heightIn * CAP_HEIGHT_RATIO;

  if (nameCap < MIN_READABLE_CAP_INCHES) {
    return (
      `The shop name prints about ${nameCap.toFixed(1)} in tall, which is small for a ` +
      `shopfront. Consider a wider board, the other layout, or a shorter trading name.`
    );
  }

  if (urlCap < MIN_READABLE_URL_CAP_INCHES) {
    return (
      `The link prints about ${urlCap.toFixed(1)} in tall, which will be hard to read. ` +
      `A shorter shop URL or the stacked layout would give it more room.`
    );
  }

  return null;
}

export function shopUrlFromName(shopName: string, prefix: string): string {
  const slug = shopName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug ? `${prefix}${slug}` : '';
}

export { INCHES_PER_FOOT };

/**
 * Physical dimension system for signboards.
 *
 * Everything downstream works from inches, never from pixels — the signboard is
 * a print product, so the physical size is the source of truth and pixels are
 * derived from it at export time.
 */

export type SizeUnit = 'ft' | 'in';

export const INCHES_PER_FOOT = 12;

/** Our signboard fabricator will not print shorter than 1.5 ft. */
export const MIN_HEIGHT_IN = 1.5 * INCHES_PER_FOOT;
/** These are shopfront signboards, so 10 ft is the widest we ever order. */
export const MAX_WIDTH_IN = 10 * INCHES_PER_FOOT;
export const MIN_WIDTH_IN = 2 * INCHES_PER_FOOT;
export const MAX_HEIGHT_IN = 4 * INCHES_PER_FOOT;

export const DPI_OPTIONS = [100, 150, 300] as const;
export const DEFAULT_DPI = 150;

/**
 * Safari refuses a canvas past 16384 px on either axis, and every browser has a
 * total-area ceiling. A 10 ft board at 150 DPI is 18000 x 3600 (65 MP), so
 * exports past these limits step the DPI down rather than handing back a blank
 * canvas. Large-format printing is viewed from metres away, so the reduced DPI
 * is invisible in practice — but we report it rather than hiding it.
 */
export const MAX_CANVAS_EDGE = 16384;
export const MAX_CANVAS_PIXELS = 40_000_000;

export interface PhysicalSize {
  widthIn: number;
  heightIn: number;
}

export function toInches(value: number, unit: SizeUnit): number {
  return unit === 'ft' ? value * INCHES_PER_FOOT : value;
}

export function fromInches(inches: number, unit: SizeUnit): number {
  return unit === 'ft' ? inches / INCHES_PER_FOOT : inches;
}

export function aspectRatio(size: PhysicalSize): number {
  return size.widthIn / size.heightIn;
}

function trimNumber(value: number): string {
  return String(Math.round(value * 100) / 100);
}

/** `24` -> `"2 ft"`, `18` -> `"1.5 ft"`. Staff think in feet, so we show feet. */
export function formatFeet(inches: number): string {
  return `${trimNumber(inches / INCHES_PER_FOOT)} ft`;
}

export function formatSize(size: PhysicalSize): string {
  return `${formatFeet(size.widthIn)} × ${formatFeet(size.heightIn)}`;
}

export function formatInches(size: PhysicalSize): string {
  return `${trimNumber(size.widthIn)} in × ${trimNumber(size.heightIn)} in`;
}

/** `"5 : 1"` when it divides cleanly, `"3.33 : 1"` when it does not. */
export function formatRatio(size: PhysicalSize): string {
  const ratio = aspectRatio(size);
  const isWhole = Math.abs(ratio - Math.round(ratio)) < 0.005;
  return `${isWhole ? Math.round(ratio) : ratio.toFixed(2)} : 1`;
}

export interface ExportResolution {
  widthPx: number;
  heightPx: number;
  requestedDpi: number;
  effectiveDpi: number;
  /** True when browser canvas limits forced the DPI below what was asked for. */
  reduced: boolean;
}

export function exportResolution(size: PhysicalSize, dpi: number): ExportResolution {
  const rawWidth = size.widthIn * dpi;
  const rawHeight = size.heightIn * dpi;

  const edgeScale = MAX_CANVAS_EDGE / Math.max(rawWidth, rawHeight);
  const areaScale = Math.sqrt(MAX_CANVAS_PIXELS / (rawWidth * rawHeight));
  const scale = Math.min(1, edgeScale, areaScale);

  const effectiveDpi = Math.max(1, Math.floor(dpi * scale));
  return {
    widthPx: Math.round(size.widthIn * effectiveDpi),
    heightPx: Math.round(size.heightIn * effectiveDpi),
    requestedDpi: dpi,
    effectiveDpi,
    reduced: effectiveDpi < dpi,
  };
}

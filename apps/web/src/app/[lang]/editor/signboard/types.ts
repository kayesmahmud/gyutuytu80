import { DEFAULT_DPI, type SizeUnit } from './lib/dimensions';
import type { SignboardLayoutId } from './lib/layoutEngine';

export type { SizeUnit };

export interface SignboardFormState {
  shopName: string;
  shopUrl: string;
  width: string;
  widthUnit: SizeUnit;
  height: string;
  heightUnit: SizeUnit;
  dpi: number;
  layoutId: SignboardLayoutId;
}

export interface FieldErrors {
  shopName?: string;
  shopUrl?: string;
  width?: string;
  height?: string;
}

export interface SizePreset {
  /** Feet. Presets are the sizes our fabricator quotes for. */
  width: number;
  height: number;
}

/**
 * Every preset respects the 1.5 ft minimum height. The reference artwork included
 * a 4 ft x 1 ft board, which our fabricator will not print — it is 4 ft x 1.5 ft
 * here instead.
 */
export const SIZE_PRESETS: SizePreset[] = [
  { width: 10, height: 2 },
  { width: 10, height: 1.5 },
  { width: 8, height: 2 },
  { width: 6, height: 1.5 },
  { width: 5, height: 1.5 },
  { width: 4, height: 1.5 },
];

/**
 * Shown on the dashboard so staff can see how each composition holds up. Each
 * example uses the layout we recommend for that width.
 */
export const EXAMPLE_BOARDS: {
  shopName: string;
  width: number;
  height: number;
  layoutId: SignboardLayoutId;
}[] = [
  { shopName: 'Shrestha Electronics', width: 10, height: 2, layoutId: 'side-by-side' },
  { shopName: 'Mobile Hub', width: 10, height: 1.5, layoutId: 'side-by-side' },
  { shopName: 'Gadget House', width: 8, height: 2, layoutId: 'side-by-side' },
  { shopName: 'Tech Zone', width: 5, height: 1.5, layoutId: 'stacked' },
  { shopName: 'Beauty Care', width: 4, height: 1.5, layoutId: 'stacked' },
];

export const SHOP_URL_DOMAIN = 'thulobazaar.com.np';
export const SHOP_URL_PREFIX = `www.${SHOP_URL_DOMAIN}/en/shop/`;

export const DEFAULT_FORM_STATE: SignboardFormState = {
  shopName: '',
  shopUrl: '',
  width: '10',
  widthUnit: 'ft',
  height: '2',
  heightUnit: 'ft',
  dpi: DEFAULT_DPI,
  layoutId: 'side-by-side',
};

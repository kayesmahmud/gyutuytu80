/**
 * Shared constants for the ads filter system
 * Used by desktop sidebar, mobile drawer, and carousel
 * Designed for future React Native mobile app reuse
 */

import type { FilterOption } from './types';

// Labels are translation keys in the 'ads' namespace, like CONDITION_OPTIONS
export const SORT_OPTIONS: FilterOption[] = [
  { value: 'newest', label: 'newestFirst', icon: '📅' },
  { value: 'oldest', label: 'oldestFirst', icon: '📅' },
  { value: 'price_asc', label: 'priceLowToHigh', icon: '💰' },
  { value: 'price_desc', label: 'priceHighToLow', icon: '💰' },
];

export const CONDITION_OPTIONS: FilterOption[] = [
  { value: '', label: 'anyCondition', icon: null },
  { value: 'Brand New', label: 'brandNew', icon: '✨' },
  { value: 'Used', label: 'used', icon: '♻️' },
];

/** Default sort value */
export const DEFAULT_SORT = 'newest';

/** Default condition value (empty = any) */
export const DEFAULT_CONDITION = '';

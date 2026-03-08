/**
 * Common Fields - Used across multiple categories
 */

import type { FormField } from '../types';

// Condition field variants
export const conditionNewUsed: FormField = {
  name: 'condition',
  label: 'Condition',
  labelNe: 'अवस्था',
  type: 'select',
  required: true,
  options: ['Brand New', 'Used'],
  optionsNe: ['नयाँ', 'पुरानो'],
  appliesTo: 'all',
};

export const conditionWithRefurbished: FormField = {
  name: 'condition',
  label: 'Condition',
  labelNe: 'अवस्था',
  type: 'select',
  required: true,
  options: ['Brand New', 'Refurbished', 'Used'],
  optionsNe: ['नयाँ', 'रिफर्बिस्ड', 'पुरानो'],
  appliesTo: 'all',
};

export const conditionOptional: FormField = {
  name: 'condition',
  label: 'Condition',
  labelNe: 'अवस्था',
  type: 'select',
  required: false,
  options: ['Brand New', 'Used'],
  optionsNe: ['नयाँ', 'पुरानो'],
  appliesTo: 'all',
};

// Brand field - base definition (placeholder should be overridden)
export const brandField: FormField = {
  name: 'brand',
  label: 'Brand',
  labelNe: 'ब्रान्ड',
  type: 'text',
  required: false,
  placeholder: 'Enter brand name',
  placeholderNe: 'ब्रान्ड नाम लेख्नुहोस्',
  appliesTo: 'all',
};

// Model field
export const modelField: FormField = {
  name: 'model',
  label: 'Model',
  labelNe: 'मोडेल',
  type: 'text',
  required: false,
  placeholder: 'Enter model name',
  placeholderNe: 'मोडेल नाम लेख्नुहोस्',
  appliesTo: 'all',
};

// Color field
export const colorField: FormField = {
  name: 'color',
  label: 'Color',
  labelNe: 'रङ',
  type: 'text',
  required: false,
  placeholder: 'e.g., Black, White, Red',
  placeholderNe: 'जस्तै, कालो, सेतो, रातो',
  appliesTo: 'all',
};

// Warranty field
export const warrantyField: FormField = {
  name: 'warranty',
  label: 'Warranty',
  labelNe: 'वारेन्टी',
  type: 'select',
  required: false,
  options: ['No Warranty', 'Under Warranty (< 6 months)', 'Under Warranty (6-12 months)', 'Under Warranty (1+ years)'],
  optionsNe: ['वारेन्टी छैन', 'वारेन्टी अन्तर्गत (< ६ महिना)', 'वारेन्टी अन्तर्गत (६-१२ महिना)', 'वारेन्टी अन्तर्गत (१+ वर्ष)'],
  appliesTo: 'all',
};

// Year field
export const yearField: FormField = {
  name: 'year',
  label: 'Year',
  labelNe: 'वर्ष',
  type: 'number',
  required: false,
  min: 1980,
  max: 2025,
  placeholder: 'e.g., 2020',
  placeholderNe: 'जस्तै, २०२०',
  appliesTo: 'all',
};

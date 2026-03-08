/**
 * Shared/Common Field Definitions
 * These fields are reused across multiple templates
 */

import type { SelectField, TextField, AppliesTo } from './types';

// Common condition field options
export const CONDITION_OPTIONS = {
  NEW_USED: ['Brand New', 'Used'] as const,
  NEW_RECONDITIONED_USED: ['Brand New', 'Reconditioned', 'Used'] as const,
};

export const CONDITION_OPTIONS_NE = {
  NEW_USED: ['नयाँ', 'पुरानो'] as const,
  NEW_RECONDITIONED_USED: ['नयाँ', 'रिफर्बिस्ड', 'पुरानो'] as const,
};

// Common warranty options
export const WARRANTY_OPTIONS = [
  'No Warranty',
  'Under Warranty (< 6 months)',
  'Under Warranty (6-12 months)',
  'Under Warranty (1+ years)',
] as const;

export const WARRANTY_OPTIONS_NE = [
  'वारेन्टी छैन',
  'वारेन्टी अन्तर्गत (< ६ महिना)',
  'वारेन्टी अन्तर्गत (६-१२ महिना)',
  'वारेन्टी अन्तर्गत (१+ वर्ष)',
] as const;

// Job categories list - used in multiple fields
export const JOB_CATEGORIES = [
  'Accountant', 'Beautician', 'Business Analyst', 'Chef', 'Collection & Recovery Agents',
  'Construction Worker', 'Content Writer', 'Counsellor', 'Customer Service Executive',
  'Customer Support Manager', 'Delivery Rider', 'Designer', 'Digital Marketing Executive',
  'Digital Marketing Manager', 'Doctor', 'Driver', 'Electrician', 'Engineer', 'Event Planner',
  'Fire Fighter', 'Flight Attendant', 'Florist', 'Gardener', 'Garments Worker',
  'Government Jobs', 'Hospitality Executive', 'House Keeper', 'HR Executive', 'HR Manager',
  'Interior Designer', 'Journalist', 'Lab Assistant', 'Maid', 'Management Trainee',
  'Market Research Analyst', 'Marketing Executive', 'Marketing Manager', 'Mechanic',
  'Medical Representative', 'Merchandiser', 'Nurse', 'Office Admin', 'Operator',
  'Pharmacist', 'Photographer', 'Product Sourcing Executive', 'Production Executive',
  'Public Relations Officer', 'Purchase Officer', 'Quality Checker', 'Quality Controller',
  'Sales Executive', 'Sales Manager Field', 'Security Guard', 'SEO Specialist',
  'Social Media Presenter', 'Software Engineer', 'Supervisor', 'Teacher', 'Videographer', 'Other',
] as const;

// Overseas job countries
export const OVERSEAS_COUNTRIES = [
  'Bulgaria', 'Croatia', 'Serbia', 'Saudi Arabia', 'UAE', 'Qatar', 'Malaysia', 'Singapore',
] as const;

// Field factory functions for creating common fields with custom appliesTo

export function createConditionField(
  options: readonly string[],
  appliesTo: AppliesTo = 'all',
  required = true,
  optionsNe?: readonly string[]
): SelectField {
  return {
    name: 'condition',
    label: 'Condition',
    labelNe: 'अवस्था',
    type: 'select',
    required,
    options: [...options],
    optionsNe: optionsNe ? [...optionsNe] : undefined,
    appliesTo,
  };
}

export function createBrandField(
  placeholder: string,
  appliesTo: AppliesTo = 'all',
  required = true,
  placeholderNe?: string
): TextField {
  return {
    name: 'brand',
    label: 'Brand',
    labelNe: 'ब्रान्ड',
    type: 'text',
    required,
    placeholder,
    placeholderNe: placeholderNe || 'ब्रान्ड नाम लेख्नुहोस्',
    appliesTo,
  };
}

export function createModelField(
  placeholder: string,
  appliesTo: AppliesTo = 'all',
  required = false,
  placeholderNe?: string
): TextField {
  return {
    name: 'model',
    label: 'Model',
    labelNe: 'मोडेल',
    type: 'text',
    required,
    placeholder,
    placeholderNe: placeholderNe || 'मोडेल नाम लेख्नुहोस्',
    appliesTo,
  };
}

export function createColorField(
  placeholder = 'e.g., Black, White, Red',
  appliesTo: AppliesTo = 'all',
  required = false,
  placeholderNe?: string
): TextField {
  return {
    name: 'color',
    label: 'Color',
    labelNe: 'रङ',
    type: 'text',
    required,
    placeholder,
    placeholderNe: placeholderNe || 'जस्तै, कालो, सेतो, रातो',
    appliesTo,
  };
}

export function createWarrantyField(appliesTo: AppliesTo = 'all'): SelectField {
  return {
    name: 'warranty',
    label: 'Warranty',
    labelNe: 'वारेन्टी',
    type: 'select',
    required: false,
    options: [...WARRANTY_OPTIONS],
    optionsNe: [...WARRANTY_OPTIONS_NE],
    appliesTo,
  };
}

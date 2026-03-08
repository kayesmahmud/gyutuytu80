/**
 * Field Translation Lookup
 *
 * Builds a flat map from field name to Nepali translations.
 * Uses the canonical field definitions from fields/*.ts which have all Ne translations.
 * Used by SpecificationsSection to display localized field labels and values.
 */

import type { FormField } from './types';

// Import all field definitions
import * as commonFields from './fields/common';
import * as electronicsFields from './fields/electronics';
import * as vehiclesFields from './fields/vehicles';
import * as propertyFields from './fields/property';
import * as fashionFields from './fields/fashion';
import * as petsFields from './fields/pets';
import * as servicesFields from './fields/services';
import * as generalFields from './fields/general';

interface FieldTranslation {
  labelNe: string;
  optionMap: Record<string, string>;
}

let cachedLookup: Record<string, FieldTranslation> | null = null;

function collectFields(module: Record<string, any>): FormField[] {
  return Object.values(module).filter(
    (v): v is FormField => v && typeof v === 'object' && 'name' in v && 'label' in v && 'type' in v
  );
}

export function getFieldTranslationLookup(): Record<string, FieldTranslation> {
  if (cachedLookup) return cachedLookup;

  const lookup: Record<string, FieldTranslation> = {};
  const allFields = [
    ...collectFields(commonFields),
    ...collectFields(electronicsFields),
    ...collectFields(vehiclesFields),
    ...collectFields(propertyFields),
    ...collectFields(fashionFields),
    ...collectFields(petsFields),
    ...collectFields(servicesFields),
    ...collectFields(generalFields),
  ];

  for (const field of allFields) {
    if (lookup[field.name]) continue;

    const optionMap: Record<string, string> = {};
    if ('options' in field && 'optionsNe' in field && field.optionsNe) {
      const options = field.options as string[];
      const optionsNe = field.optionsNe as string[];
      options.forEach((opt, i) => {
        if (optionsNe[i]) optionMap[opt] = optionsNe[i];
      });
    }

    lookup[field.name] = {
      labelNe: field.labelNe || field.label,
      optionMap,
    };
  }

  cachedLookup = lookup;
  return lookup;
}

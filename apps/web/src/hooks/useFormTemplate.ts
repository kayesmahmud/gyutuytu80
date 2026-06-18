import { useMemo, useCallback } from 'react';
import { FORM_TEMPLATES, getApplicableFields } from '@/config/formTemplates';
import { getFieldsForSubcategory, hasSubcategoryConfig } from '@/config/formTemplates/subcategories';
import { getTemplateForCategory } from '@/config/formTemplates/categoryMapping';
import type { FormField, TemplateName } from '@/config/formTemplates';

interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  formTemplate?: string;
  form_template?: string;
}

const VALID_TEMPLATES: TemplateName[] = ['electronics', 'vehicles', 'property', 'fashion', 'pets', 'services', 'general'];

// Custom subcategory fields that stay mandatory. Everything else is made
// optional so users can post without filling extra details (they can add them
// in the description instead). 'condition' is kept for search quality.
const ALWAYS_REQUIRED_FIELDS = new Set(['condition']);

function isValidTemplate(value: string): value is TemplateName {
  return VALID_TEMPLATES.includes(value as TemplateName);
}

/**
 * Custom hook for managing form templates based on category
 * Returns template configuration, fields, and validation rules
 *
 * EXACT PORT from old JavaScript version to TypeScript
 */
export function useFormTemplate(
  selectedCategory: Category | null,
  selectedSubcategory: Category | null,
  allCategories: Category[]
) {
  // Determine which template to use based on category
  const templateType = useMemo<TemplateName | null>(() => {
    if (!selectedCategory) return null;

    // Prefer the explicit form_template column when present and valid.
    const explicit = selectedCategory.formTemplate || selectedCategory.form_template;
    if (explicit && isValidTemplate(explicit)) return explicit;

    // Otherwise derive from the category name. This is robust if the API/DB ever
    // omits form_template — without it, Property would fall to the 'general'
    // template whose condition field is appliesTo:'all', leaking Condition onto
    // every property subcategory (rentals, land, etc.).
    return getTemplateForCategory(selectedCategory.name, selectedCategory.name);
  }, [selectedCategory]);

  // Get the template configuration
  const template = useMemo(() => {
    if (!templateType) return null;
    return FORM_TEMPLATES[templateType];
  }, [templateType]);

  // Get applicable fields for the selected subcategory
  // Priority: 1) Subcategory-specific config, 2) Template-based filtering
  const applicableFields = useMemo<FormField[]>(() => {
    if (!selectedSubcategory) return [];

    // First, check if there's a subcategory-specific configuration
    // This allows us to define exact fields with custom placeholders/options per subcategory
    let rawFields: FormField[];
    if (hasSubcategoryConfig(selectedSubcategory.name)) {
      rawFields = getFieldsForSubcategory(selectedSubcategory.name);
    } else if (!template) {
      // Fall back to template-based filtering for subcategories without specific configs
      return [];
    } else {
      rawFields = getApplicableFields(templateType || 'general', selectedSubcategory.name);
    }

    // Kill-switch: make every custom field optional except the allow-listed ones.
    // Drives asterisks, the HTML `required` attr, and validateFields() below.
    return rawFields.map(f => ({ ...f, required: ALWAYS_REQUIRED_FIELDS.has(f.name) }));
  }, [template, selectedSubcategory, templateType]);

  // Validate custom fields based on template rules
  const validateFields = (customFields: Record<string, any>) => {
    const errors: Record<string, string> = {};

    applicableFields.forEach(field => {
      const value = customFields[field.name];

      // Check required fields
      if (field.required && (!value || value === '' || (Array.isArray(value) && value.length === 0))) {
        errors[field.name] = `${field.label} is required`;
      }

      // Validate number fields
      if (field.type === 'number' && value) {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          errors[field.name] = `${field.label} must be a valid number`;
        } else {
          if (field.min !== undefined && numValue < field.min) {
            errors[field.name] = `${field.label} must be at least ${field.min}`;
          }
          if (field.max !== undefined && numValue > field.max) {
            errors[field.name] = `${field.label} must be at most ${field.max}`;
          }
        }
      }

      // Validate date fields
      if (field.type === 'date' && value) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          errors[field.name] = `${field.label} must be a valid date`;
        }
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  // Get initial empty values for all fields - memoized to prevent infinite loops
  const getInitialValues = useCallback(() => {
    const initialValues: Record<string, any> = {};

    applicableFields.forEach(field => {
      switch (field.type) {
        case 'multiselect':
          initialValues[field.name] = [];
          break;
        case 'checkbox':
          initialValues[field.name] = false;
          break;
        case 'number':
        case 'text':
        case 'select':
        case 'date':
        default:
          initialValues[field.name] = '';
      }
    });

    return initialValues;
  }, [applicableFields]);

  // Auto-lock gender field for fashion categories (matches old site)
  const getAutoLockedFields = () => {
    const locked: Record<string, any> = {};

    if (templateType === 'fashion' && selectedCategory) {
      // Lock gender based on parent category
      if (selectedCategory.name === "Men's Fashion & Grooming" || selectedCategory.id === 7) {
        locked.gender = 'Men';
      } else if (selectedCategory.name === "Women's Fashion & Beauty" || selectedCategory.id === 8) {
        locked.gender = 'Women';
      }
    }

    return locked;
  };

  return {
    templateType,
    template,
    fields: applicableFields,
    validateFields,
    getInitialValues,
    getAutoLockedFields
  };
}

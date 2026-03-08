'use client';

import { useLocale, useTranslations } from 'next-intl';
import { FormField } from '@/config/formTemplates';

interface DynamicFormFieldsProps {
  fields: FormField[];
  values: Record<string, any>;
  errors: Record<string, string>;
  onChange: (fieldName: string, value: any) => void;
  subcategoryName?: string;
}

/**
 * Dynamic Form Fields Component
 * Renders category-specific fields based on template configuration
 * Supports English and Nepali locale
 */
export default function DynamicFormFields({
  fields,
  values,
  errors,
  onChange,
  subcategoryName
}: DynamicFormFieldsProps) {
  const locale = useLocale();
  const t = useTranslations('formFields');
  const isNe = locale === 'ne';

  if (fields.length === 0) return null;

  const getLabel = (field: FormField) =>
    isNe && field.labelNe ? field.labelNe : field.label;

  const getPlaceholder = (field: FormField) => {
    if ('placeholderNe' in field && isNe && field.placeholderNe) return field.placeholderNe;
    if ('placeholder' in field) return field.placeholder;
    return undefined;
  };

  const getOptions = (field: FormField & { options: string[]; optionsNe?: string[] }) => {
    if (isNe && field.optionsNe && field.optionsNe.length === field.options.length) {
      return field.optionsNe;
    }
    return field.options;
  };

  const renderField = (field: FormField) => {
    const value = values[field.name] || '';
    const error = errors[field.name];
    const label = getLabel(field);

    const inputClass = `w-full px-4 py-2.5 border-2 rounded-lg text-base transition-colors ${
      error
        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
        : 'border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
    } focus:outline-none`;

    const labelClass = 'block mb-2 text-sm font-medium text-gray-700';
    const errorClass = 'text-red-600 text-sm mt-1';

    switch (field.type) {
      case 'text':
        return (
          <div key={field.name} className="form-field">
            <label className={labelClass}>
              {label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              className={inputClass}
              value={value}
              onChange={(e) => onChange(field.name, e.target.value)}
              placeholder={getPlaceholder(field)}
              required={field.required}
            />
            {error && <p className={errorClass}>{error}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={field.name} className="form-field">
            <label className={labelClass}>
              {label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="number"
              className={inputClass}
              value={value}
              onChange={(e) => onChange(field.name, e.target.value)}
              placeholder={getPlaceholder(field)}
              min={field.min}
              max={field.max}
              required={field.required}
            />
            {error && <p className={errorClass}>{error}</p>}
          </div>
        );

      case 'select': {
        const displayOptions = getOptions(field);
        return (
          <div key={field.name} className="form-field">
            <label className={labelClass}>
              {label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              className={inputClass}
              value={value}
              onChange={(e) => onChange(field.name, e.target.value)}
              required={field.required}
            >
              <option value="">{t('selectPlaceholder', { label })}</option>
              {field.options?.map((option, idx) => (
                <option key={option} value={option}>
                  {displayOptions[idx]}
                </option>
              ))}
            </select>
            {error && <p className={errorClass}>{error}</p>}
          </div>
        );
      }

      case 'multiselect': {
        const displayOptions = getOptions(field);
        return (
          <div key={field.name} className="form-field">
            <label className={labelClass}>
              {label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
              {field.options?.map((option, idx) => {
                const isChecked = Array.isArray(value) && value.includes(option);
                return (
                  <label key={option} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const currentValues = Array.isArray(value) ? value : [];
                        const newValues = e.target.checked
                          ? [...currentValues, option]
                          : currentValues.filter(v => v !== option);
                        onChange(field.name, newValues);
                      }}
                      className="w-4 h-4 text-rose-500 border-gray-300 rounded focus:ring-2 focus:ring-rose-500"
                    />
                    <span className="text-sm text-gray-700">{displayOptions[idx]}</span>
                  </label>
                );
              })}
            </div>
            {error && <p className={errorClass}>{error}</p>}
          </div>
        );
      }

      case 'checkbox':
        return (
          <div key={field.name} className="form-field">
            <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors">
              <input
                type="checkbox"
                checked={value === true}
                onChange={(e) => onChange(field.name, e.target.checked)}
                className="w-5 h-5 text-rose-500 border-gray-300 rounded focus:ring-2 focus:ring-rose-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </span>
            </label>
            {error && <p className={errorClass}>{error}</p>}
          </div>
        );

      case 'date':
        return (
          <div key={field.name} className="form-field">
            <label className={labelClass}>
              {label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="date"
              className={inputClass}
              value={value}
              onChange={(e) => onChange(field.name, e.target.value)}
              required={field.required}
            />
            {error && <p className={errorClass}>{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="dynamic-fields bg-blue-50/50 border-2 border-blue-200 rounded-xl p-6 mb-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <span className="text-2xl">📋</span>
          {t('additionalDetails')}
          {subcategoryName && (
            <span className="text-sm font-normal text-gray-600">
              {t('forSubcategory', { subcategory: subcategoryName })}
            </span>
          )}
        </h3>
        <p className="text-sm text-gray-600">
          {t('helperText')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map(field => renderField(field))}
      </div>
    </div>
  );
}

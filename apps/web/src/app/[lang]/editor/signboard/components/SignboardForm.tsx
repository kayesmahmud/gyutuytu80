'use client';

import { DPI_OPTIONS, MAX_WIDTH_IN, MIN_HEIGHT_IN, formatFeet } from '../lib/dimensions';
import { SHOP_URL_PREFIX, type FieldErrors, type SignboardFormState, type SizePreset } from '../types';
import { SizePresets } from './SizePresets';

const UNITS = ['ft', 'in'] as const;

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 ' +
  'focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#DC143C]';

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs font-medium text-[#DC143C]">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
}

interface SignboardFormProps {
  form: SignboardFormState;
  errors: FieldErrors;
  onChange: <K extends keyof SignboardFormState>(field: K, value: SignboardFormState[K]) => void;
  onPreset: (preset: SizePreset) => void;
}

export function SignboardForm({ form, errors, onChange, onPreset }: SignboardFormProps) {
  return (
    <div className="space-y-5">
      <Field label="Shop name" htmlFor="shop-name" error={errors.shopName}>
        <input
          id="shop-name"
          type="text"
          value={form.shopName}
          onChange={(event) => onChange('shopName', event.target.value)}
          placeholder="Pixel Mobile Store"
          className={inputClass}
          autoComplete="off"
        />
      </Field>

      <Field
        label="Shop URL"
        htmlFor="shop-url"
        error={errors.shopUrl}
        hint={`Filled in from the shop name — edit it if the shop uses a custom link.`}
      >
        <input
          id="shop-url"
          type="text"
          value={form.shopUrl}
          onChange={(event) => onChange('shopUrl', event.target.value)}
          placeholder={`${SHOP_URL_PREFIX}pixel-mobile-store`}
          className={inputClass}
          autoComplete="off"
          spellCheck={false}
        />
      </Field>

      <SizePresets form={form} onSelect={onPreset} />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Width" htmlFor="width" error={errors.width}>
          <div className="flex gap-2">
            <input
              id="width"
              type="number"
              step="0.5"
              min="0"
              value={form.width}
              onChange={(event) => onChange('width', event.target.value)}
              className={inputClass}
            />
            <select
              aria-label="Width unit"
              value={form.widthUnit}
              onChange={(event) => onChange('widthUnit', event.target.value as 'ft' | 'in')}
              className="rounded-lg border border-gray-300 px-2 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#DC143C]"
            >
              {UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
        </Field>

        <Field label="Height" htmlFor="height" error={errors.height}>
          <div className="flex gap-2">
            <input
              id="height"
              type="number"
              step="0.5"
              min="0"
              value={form.height}
              onChange={(event) => onChange('height', event.target.value)}
              className={inputClass}
            />
            <select
              aria-label="Height unit"
              value={form.heightUnit}
              onChange={(event) => onChange('heightUnit', event.target.value as 'ft' | 'in')}
              className="rounded-lg border border-gray-300 px-2 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#DC143C]"
            >
              {UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
        </Field>
      </div>

      <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
        Height must be at least {formatFeet(MIN_HEIGHT_IN)}{' '}
        (what signboard printers will accept). Width goes up to {formatFeet(MAX_WIDTH_IN)}.
      </p>

      <Field label="Print quality" htmlFor="dpi">
        <select
          id="dpi"
          value={form.dpi}
          onChange={(event) => onChange('dpi', Number(event.target.value))}
          className={inputClass}
        >
          {DPI_OPTIONS.map((dpi) => (
            <option key={dpi} value={dpi}>
              {dpi} DPI
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

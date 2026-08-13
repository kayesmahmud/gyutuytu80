'use client';

import { SIZE_PRESETS, type SignboardFormState, type SizePreset } from '../types';

interface SizePresetsProps {
  form: SignboardFormState;
  onSelect: (preset: SizePreset) => void;
}

function matchesPreset(form: SignboardFormState, preset: SizePreset): boolean {
  return (
    form.widthUnit === 'ft' &&
    form.heightUnit === 'ft' &&
    Number(form.width) === preset.width &&
    Number(form.height) === preset.height
  );
}

export function SizePresets({ form, onSelect }: SizePresetsProps) {
  const isCustom = !SIZE_PRESETS.some((preset) => matchesPreset(form, preset));

  return (
    <div>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
        Quick sizes
      </span>
      <div className="flex flex-wrap gap-2">
        {SIZE_PRESETS.map((preset) => {
          const active = matchesPreset(form, preset);
          return (
            <button
              key={`${preset.width}x${preset.height}`}
              type="button"
              onClick={() => onSelect(preset)}
              aria-pressed={active}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? 'border-[#DC143C] bg-[#DC143C] text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              {preset.width} ft × {preset.height} ft
            </button>
          );
        })}
        <span
          className={`rounded-lg border border-dashed px-3 py-1.5 text-sm font-medium ${
            isCustom ? 'border-[#DC143C] text-[#DC143C]' : 'border-gray-300 text-gray-400'
          }`}
        >
          {isCustom ? 'Custom size' : 'Or type any size'}
        </span>
      </div>
    </div>
  );
}

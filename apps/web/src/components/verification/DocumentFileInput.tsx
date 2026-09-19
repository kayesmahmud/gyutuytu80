'use client';

import { ChangeEvent, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Camera } from 'lucide-react';

interface DocumentFileInputProps {
  id: string;
  name: string;
  label: string;
  hint?: string;
  accept?: string;
  required?: boolean;
  /** 'user' opens the front camera (selfies), 'environment' the back one (documents). */
  capture?: 'user' | 'environment';
  fileName?: string | null;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

/**
 * File picker for verification documents. Alongside the normal chooser there
 * is a "Take photo" button that opens the device camera directly — it drives
 * a second, hidden input with the `capture` attribute, because putting
 * `capture` on the main input removes the gallery option on iOS.
 */
export default function DocumentFileInput({
  id,
  name,
  label,
  hint,
  accept = 'image/*',
  required = false,
  capture = 'environment',
  fileName,
  onChange,
}: DocumentFileInputProps) {
  const t = useTranslations('verification');
  const cameraRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label htmlFor={id} className="block mb-2 font-semibold text-gray-900 text-sm">
        {label}
      </label>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <input
          type="file"
          id={id}
          name={name}
          accept={accept}
          onChange={onChange}
          required={required}
          className="w-full min-w-0 text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded-lg border border-indigo-200 bg-white text-indigo-700 text-sm font-medium hover:bg-indigo-50 whitespace-nowrap"
        >
          <Camera className="w-4 h-4" aria-hidden />
          {t('takePhoto')}
        </button>
        {/* Camera-only picker; a captured photo lands in the same form field. */}
        <input
          ref={cameraRef}
          type="file"
          name={name}
          accept="image/*"
          capture={capture}
          onChange={onChange}
          className="hidden"
          tabIndex={-1}
          aria-hidden
        />
      </div>
      {fileName && <p className="text-xs text-green-700 mt-1 truncate">✓ {fileName}</p>}
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

'use client';

import type { ExportFormat } from '../lib/exporters';

const FORMATS: { format: ExportFormat; label: string; hint: string }[] = [
  { format: 'png', label: 'PNG', hint: 'Lossless raster' },
  { format: 'jpg', label: 'JPG', hint: 'Smaller file' },
  { format: 'pdf', label: 'PDF', hint: 'True print size' },
];

interface ExportButtonsProps {
  isGenerated: boolean;
  exporting: ExportFormat | null;
  disabled: boolean;
  onGenerate: () => void;
  onDownload: (format: ExportFormat) => void;
}

export function ExportButtons({
  isGenerated,
  exporting,
  disabled,
  onGenerate,
  onDownload,
}: ExportButtonsProps) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onGenerate}
        disabled={disabled}
        className="w-full rounded-lg bg-[#DC143C] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#b8102f] disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        Generate Signboard
      </button>

      {isGenerated ? (
        <div className="grid grid-cols-3 gap-2">
          {FORMATS.map(({ format, label, hint }) => (
            <button
              key={format}
              type="button"
              onClick={() => onDownload(format)}
              disabled={exporting !== null}
              className="rounded-lg border border-gray-300 px-3 py-2 text-center transition-colors hover:border-[#DC143C] hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="block text-sm font-semibold text-gray-900">
                {exporting === format ? 'Working…' : label}
              </span>
              <span className="block text-[11px] text-gray-500">{hint}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-center text-xs text-gray-500">
          Generate to unlock the print downloads.
        </p>
      )}
    </div>
  );
}

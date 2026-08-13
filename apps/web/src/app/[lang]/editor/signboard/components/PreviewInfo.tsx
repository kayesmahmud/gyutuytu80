'use client';

import {
  formatInches,
  formatRatio,
  formatSize,
  type ExportResolution,
  type PhysicalSize,
} from '../lib/dimensions';

interface PreviewInfoProps {
  size: PhysicalSize | null;
  resolution: ExportResolution | null;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-gray-900">{value}</dd>
    </div>
  );
}

export function PreviewInfo({ size, resolution }: PreviewInfoProps) {
  if (!size || !resolution) return null;

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat label="Size" value={formatSize(size)} />
      <Stat label="In inches" value={formatInches(size)} />
      <Stat label="Aspect ratio" value={formatRatio(size)} />
      <Stat
        label="Export"
        value={`${resolution.widthPx.toLocaleString()} × ${resolution.heightPx.toLocaleString()} px`}
      />
      {resolution.reduced ? (
        <p className="col-span-2 text-xs text-gray-500 sm:col-span-4">
          Exports at {resolution.effectiveDpi} DPI rather than {resolution.requestedDpi}
          {' '}— a board this wide exceeds the browser&apos;s maximum canvas size. At this physical
          size the difference is not visible in print.
        </p>
      ) : null}
    </dl>
  );
}

/**
 * Print-resolution export.
 *
 * Exports are rendered into their own canvas at print size — never scraped from
 * the on-screen preview — so a 10 ft x 2 ft board leaves here as a 10 ft x 2 ft
 * image rather than a screenshot of a browser element.
 */

import { exportResolution, formatFeet, type ExportResolution, type PhysicalSize } from './dimensions';
import type { SignboardLayoutId } from './layoutEngine';
import { drawSignboard, type RenderReport, type SignboardContent } from './renderer';

export type ExportFormat = 'png' | 'jpg' | 'pdf';

const JPEG_QUALITY = 0.95;
const POINTS_PER_INCH = 72;

export interface RenderedExport {
  canvas: HTMLCanvasElement;
  resolution: ExportResolution;
  report: RenderReport;
}

export interface ExportRequest {
  size: PhysicalSize;
  dpi: number;
  content: SignboardContent;
  wordmark: ImageBitmap;
  fontFamily: string;
  layoutId: SignboardLayoutId;
}

export function renderToCanvas({
  size,
  dpi,
  content,
  wordmark,
  fontFamily,
  layoutId,
}: ExportRequest): RenderedExport {
  const resolution = exportResolution(size, dpi);

  const canvas = document.createElement('canvas');
  canvas.width = resolution.widthPx;
  canvas.height = resolution.heightPx;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create a canvas for the export.');

  const report = drawSignboard(ctx, {
    width: resolution.widthPx,
    height: resolution.heightPx,
    content,
    wordmark,
    fontFamily,
    layoutId,
  });

  return { canvas, resolution, report };
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('The browser could not encode the image.'))),
      type,
      quality
    );
  });
}

/**
 * Builds a single-page PDF wrapping the rendered JPEG.
 *
 * Hand-rolled rather than pulling in a PDF library: the only thing we need from
 * PDF is a page whose MediaBox states the real physical size, so the print shop
 * gets "120 x 24 inches" instead of a pixel count they have to reinterpret.
 * That is a few hundred bytes of scaffolding around the image.
 */
function buildPdf(jpeg: Uint8Array, widthPx: number, heightPx: number, size: PhysicalSize): Blob {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;

  const push = (data: string | Uint8Array) => {
    const bytes = typeof data === 'string' ? encoder.encode(data) : data;
    chunks.push(bytes);
    length += bytes.length;
  };
  const beginObject = (body: string) => {
    offsets.push(length);
    push(body);
  };

  const pageWidth = (size.widthIn * POINTS_PER_INCH).toFixed(2);
  const pageHeight = (size.heightIn * POINTS_PER_INCH).toFixed(2);
  const content = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ\n`;

  // The binary comment marks the file as containing binary data, which stops
  // naive tools from mangling the embedded JPEG as text.
  push('%PDF-1.4\n%âãÏÓ\n');

  beginObject('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  beginObject('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  beginObject(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}]` +
      ` /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  );

  offsets.push(length);
  push(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${widthPx} /Height ${heightPx}` +
      ` /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode` +
      ` /Length ${jpeg.length} >>\nstream\n`
  );
  push(jpeg);
  push('\nendstream\nendobj\n');

  beginObject(`5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`);

  // Every xref entry must be exactly 20 bytes, or readers reject the table.
  const xrefOffset = length;
  const entries = offsets
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('');
  push(`xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n${entries}`);
  push(
    `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  );

  return new Blob(chunks as BlobPart[], { type: 'application/pdf' });
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'signboard'
  );
}

export function exportFilename(
  content: SignboardContent,
  size: PhysicalSize,
  format: ExportFormat
): string {
  const dimensions = `${formatFeet(size.widthIn)}-x-${formatFeet(size.heightIn)}`;
  return `${slugify(content.shopName)}-${slugify(dimensions)}.${format}`;
}

export async function exportBlob(
  rendered: RenderedExport,
  size: PhysicalSize,
  format: ExportFormat
): Promise<Blob> {
  if (format === 'png') return toBlob(rendered.canvas, 'image/png');
  if (format === 'jpg') return toBlob(rendered.canvas, 'image/jpeg', JPEG_QUALITY);

  const jpeg = await toBlob(rendered.canvas, 'image/jpeg', JPEG_QUALITY);
  const bytes = new Uint8Array(await jpeg.arrayBuffer());
  return buildPdf(bytes, rendered.canvas.width, rendered.canvas.height, size);
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  // Revoking synchronously can cancel the download in Safari.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { FALLBACK_FONT_STACK, resolveFontFamily } from './lib/constants';
import { exportResolution } from './lib/dimensions';
import {
  exportBlob,
  exportFilename,
  renderToCanvas,
  triggerDownload,
  type ExportFormat,
} from './lib/exporters';
import {
  ensureSignboardFonts,
  loadWordmark,
  type RenderReport,
  type SignboardContent,
} from './lib/renderer';
import {
  hasErrors,
  parseSize,
  readabilityWarning,
  shopUrlFromName,
  validateForm,
} from './lib/validation';
import {
  DEFAULT_FORM_STATE,
  SHOP_URL_PREFIX,
  type FieldErrors,
  type SignboardFormState,
  type SizePreset,
} from './types';

const PLACEHOLDER: SignboardContent = {
  shopName: 'Your Shop Name',
  shopUrl: `${SHOP_URL_PREFIX}your-shop`,
};

export function useSignboard() {
  const [form, setForm] = useState<SignboardFormState>(DEFAULT_FORM_STATE);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [wordmark, setWordmark] = useState<ImageBitmap | null>(null);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [fontFamily, setFontFamily] = useState(FALLBACK_FONT_STACK);
  const [ready, setReady] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [report, setReport] = useState<RenderReport | null>(null);

  // Once someone types their own URL we stop overwriting it from the shop name.
  const urlEdited = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let bitmap: ImageBitmap | null = null;

    const family = resolveFontFamily();
    setFontFamily(family);

    (async () => {
      try {
        // Fonts and artwork must both be in place before the first draw, or the
        // canvas quietly substitutes a fallback typeface.
        const [loaded] = await Promise.all([loadWordmark(), ensureSignboardFonts(family)]);
        if (cancelled) {
          loaded.close();
          return;
        }
        bitmap = loaded;
        setWordmark(loaded);
        setReady(true);
      } catch (error) {
        if (!cancelled) {
          setAssetError(error instanceof Error ? error.message : 'Could not load the signboard artwork.');
        }
      }
    })();

    return () => {
      cancelled = true;
      bitmap?.close();
    };
  }, []);

  const setField = useCallback(
    <K extends keyof SignboardFormState>(field: K, value: SignboardFormState[K]) => {
      setIsGenerated(false);
      setExportError(null);
      setForm((previous) => {
        const next = { ...previous, [field]: value };

        if (field === 'shopUrl') urlEdited.current = true;
        if (field === 'shopName' && !urlEdited.current) {
          next.shopUrl = shopUrlFromName(String(value), SHOP_URL_PREFIX);
        }
        return next;
      });
      setErrors((previous) => {
        if (!(field in previous)) return previous;
        const next = { ...previous };
        delete next[field as keyof FieldErrors];
        return next;
      });
    },
    []
  );

  const applyPreset = useCallback((preset: SizePreset) => {
    setIsGenerated(false);
    setForm((previous) => ({
      ...previous,
      width: String(preset.width),
      widthUnit: 'ft',
      height: String(preset.height),
      heightUnit: 'ft',
    }));
    setErrors(({ width: _width, height: _height, ...rest }) => rest);
  }, []);

  const size = useMemo(() => parseSize(form), [form]);
  const resolution = useMemo(
    () => (size ? exportResolution(size, form.dpi) : null),
    [size, form.dpi]
  );

  /** What the preview draws — falls back to sample text so it is never blank. */
  const previewContent = useMemo<SignboardContent>(
    () => ({
      shopName: form.shopName.trim() || PLACEHOLDER.shopName,
      shopUrl: form.shopUrl.trim() || PLACEHOLDER.shopUrl,
    }),
    [form.shopName, form.shopUrl]
  );

  const warning = useMemo(
    () =>
      report && size
        ? readabilityWarning(report.shopNameFontRatio, report.visitFontRatio, size)
        : null,
    [report, size]
  );

  const generate = useCallback(() => {
    const found = validateForm(form);
    setErrors(found);
    setIsGenerated(!hasErrors(found));
    return !hasErrors(found);
  }, [form]);

  const download = useCallback(
    async (format: ExportFormat) => {
      if (!size || !wordmark) return;

      setExporting(format);
      setExportError(null);
      try {
        const content: SignboardContent = {
          shopName: form.shopName.trim(),
          shopUrl: form.shopUrl.trim(),
        };
        // Rendered fresh at print size each time rather than cached — a 10 ft
        // board is a ~40 megapixel canvas, too much to hold in state between
        // clicks.
        const rendered = renderToCanvas({
          size,
          dpi: form.dpi,
          content,
          wordmark,
          fontFamily,
          layoutId: form.layoutId,
        });
        const blob = await exportBlob(rendered, size, format);
        triggerDownload(blob, exportFilename(content, size, format));
      } catch (error) {
        setExportError(error instanceof Error ? error.message : 'The export failed.');
      } finally {
        setExporting(null);
      }
    },
    [size, wordmark, form.shopName, form.shopUrl, form.dpi, form.layoutId, fontFamily]
  );

  return {
    form,
    errors,
    size,
    resolution,
    previewContent,
    wordmark,
    fontFamily,
    ready,
    assetError,
    isGenerated,
    exporting,
    exportError,
    warning,
    setField,
    applyPreset,
    generate,
    download,
    onRender: setReport,
  };
}

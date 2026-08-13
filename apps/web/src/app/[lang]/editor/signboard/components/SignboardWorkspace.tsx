'use client';

import { useSignboard } from '../useSignboard';
import { ExampleBoards } from './ExampleBoards';
import { ExportButtons } from './ExportButtons';
import { LayoutSelector } from './LayoutSelector';
import { PreviewInfo } from './PreviewInfo';
import { SignboardForm } from './SignboardForm';
import { SignboardPreview } from './SignboardPreview';

interface SignboardWorkspaceProps {
  /** Page heading, supplied by the caller — the staff panel and the public page
   *  introduce this tool very differently. */
  header?: React.ReactNode;
}

/**
 * The generator itself, with no dependency on the editor shell or on staff auth.
 * Both the staff page and the public page render this, so shop owners and staff
 * are always working with the same renderer and the same rules.
 */
export function SignboardWorkspace({ header }: SignboardWorkspaceProps) {
  const {
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
    onRender,
  } = useSignboard();

  return (
    <div className="space-y-4 sm:space-y-6">
      {header}

      {assetError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {assetError}
        </div>
      ) : null}

      {/* Preview leads on desktop; the controls sit alongside and stack on mobile. */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Live preview</h2>
            <SignboardPreview
              content={previewContent}
              size={size}
              wordmark={wordmark}
              fontFamily={fontFamily}
              layoutId={form.layoutId}
              onRender={onRender}
            />
            <div className="mt-4 border-t border-gray-100 pt-4">
              <PreviewInfo size={size} resolution={resolution} />
            </div>
            {warning ? (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {warning}
              </p>
            ) : null}
          </section>

          <ExampleBoards wordmark={wordmark} fontFamily={fontFamily} />
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">Signboard details</h2>
            <SignboardForm
              form={form}
              errors={errors}
              onChange={setField}
              onPreset={applyPreset}
            />
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <LayoutSelector
              selected={form.layoutId}
              size={size}
              content={previewContent}
              wordmark={wordmark}
              fontFamily={fontFamily}
              onSelect={(layoutId) => setField('layoutId', layoutId)}
            />
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <ExportButtons
              isGenerated={isGenerated}
              exporting={exporting}
              disabled={!ready}
              onGenerate={generate}
              onDownload={download}
            />
            {exportError ? (
              <p className="mt-3 text-xs font-medium text-[#DC143C]">{exportError}</p>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

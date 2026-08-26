'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import { getTemplates, incrementTemplateUsage } from '@/lib/editorApi';
import type { ApiTemplate } from '@/lib/editorApi';

interface RejectTemplatePickerProps {
  /** Current textarea value — picking asks before overwriting non-empty text. */
  currentText?: string;
  onPick: (text: string) => void;
}

// Canned rejection reasons from the editor's Response Templates
// (category "verification_rejection": global templates + the editor's own).
// Renders nothing when the list can't be loaded, so the reject modal
// keeps working even if the templates API is unreachable.
export function RejectTemplatePicker({ currentText, onPick }: RejectTemplatePickerProps) {
  const [templates, setTemplates] = useState<ApiTemplate[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getTemplates({ category: 'verification_rejection' })
      .then((res) => {
        if (!cancelled && res.success && Array.isArray(res.data)) {
          setTemplates(res.data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (templates.length === 0) return null;

  const pick = (template: ApiTemplate, text: string) => {
    if (
      currentText?.trim() &&
      !window.confirm('Replace the current rejection reason with this template?')
    ) {
      return;
    }
    onPick(text);
    setOpen(false);
    incrementTemplateUsage(template.id).catch(() => {});
  };

  return (
    <div className="relative mb-2" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
      >
        <FileText size={16} />
        Use a template
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto z-10">
          {templates.map((t) => (
            <div
              key={t.id}
              className="flex items-start gap-2 px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <button type="button" onClick={() => pick(t, t.content)} className="flex-1 text-left min-w-0">
                <div className="text-sm font-medium text-gray-900">{t.title}</div>
                <div className="text-xs text-gray-500 truncate">{t.content}</div>
              </button>
              {t.contentNe && (
                <button
                  type="button"
                  onClick={() => pick(t, t.contentNe!)}
                  className="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 flex-shrink-0"
                  title={t.titleNe || 'Insert Nepali version'}
                >
                  ने
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

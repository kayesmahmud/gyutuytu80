'use client';

import { EditorModal } from '@/components/editor';
import type { TemplateFormData, Visibility } from '../types';

interface TemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  formData: TemplateFormData;
  onFormChange: (data: TemplateFormData) => void;
  onSubmit: () => void;
  submitLabel: string;
}

const inputClass =
  'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent';

export default function TemplateFormModal({
  isOpen,
  onClose,
  title,
  formData,
  onFormChange,
  onSubmit,
  submitLabel,
}: TemplateFormModalProps) {
  const setVisibility = (visibility: Visibility) => onFormChange({ ...formData, visibility });

  return (
    <EditorModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="2xl"
      footer={
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!formData.title || !formData.content}
            className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitLabel}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Category + Visibility */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select
              value={formData.category}
              onChange={(e) => onFormChange({ ...formData, category: e.target.value })}
              className={inputClass}
            >
              <option value="ad_rejection">Ad Rejection</option>
              <option value="verification_rejection">Verification</option>
              <option value="support">Support Response</option>
              <option value="suspension">Account Suspension</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Visibility</label>
            <div className="inline-flex w-full rounded-lg border border-gray-300 overflow-hidden text-sm">
              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`flex-1 px-3 py-2 font-medium transition-colors ${
                  formData.visibility === 'private' ? 'bg-gray-700 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                🔒 Private
              </button>
              <button
                type="button"
                onClick={() => setVisibility('global')}
                className={`flex-1 px-3 py-2 font-medium transition-colors ${
                  formData.visibility === 'global' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                🌐 Global
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {formData.visibility === 'global'
                ? 'Shared with all editors.'
                : 'Only you can see this.'}
            </p>
          </div>
        </div>

        {/* English */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Title (English)</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => onFormChange({ ...formData, title: e.target.value })}
            placeholder="e.g., Blurry / low-quality photos"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Content (English)</label>
          <textarea
            value={formData.content}
            onChange={(e) => onFormChange({ ...formData, content: e.target.value })}
            placeholder="Enter the English message... You can use {name}, {item}, {reason}, {days}."
            rows={4}
            className={`${inputClass} resize-y`}
          />
        </div>

        {/* Nepali (optional) */}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-2">नेपाली (optional)</p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title (Nepali)</label>
              <input
                type="text"
                value={formData.titleNe}
                onChange={(e) => onFormChange({ ...formData, titleNe: e.target.value })}
                placeholder="जस्तै, धमिलो वा कम गुणस्तरको फोटो"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Content (Nepali)</label>
              <textarea
                value={formData.contentNe}
                onChange={(e) => onFormChange({ ...formData, contentNe: e.target.value })}
                placeholder="नेपाली सन्देश लेख्नुहोस्... {name}, {item}, {reason}, {days} प्रयोग गर्न सक्नुहुन्छ।"
                rows={4}
                className={`${inputClass} resize-y`}
              />
            </div>
          </div>
        </div>
      </div>
    </EditorModal>
  );
}

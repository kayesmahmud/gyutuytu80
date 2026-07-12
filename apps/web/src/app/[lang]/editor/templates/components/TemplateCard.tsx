'use client';

import { useState } from 'react';
import { getBadgeClasses } from '@/lib/editorApi';
import type { Template, Lang } from '../types';
import { getCategoryLabel } from '../types';

interface TemplateCardProps {
  template: Template;
  onCopy: (content: string, id: number) => void;
  onEdit: (template: Template) => void;
  onDelete: (id: number) => void;
}

export default function TemplateCard({ template, onCopy, onEdit, onDelete }: TemplateCardProps) {
  const hasNepali = !!template.contentNe;
  const [lang, setLang] = useState<Lang>('en');
  const [copied, setCopied] = useState(false);

  const activeLang: Lang = hasNepali ? lang : 'en';
  const displayTitle = activeLang === 'ne' ? template.titleNe || template.title : template.title;
  const displayContent = activeLang === 'ne' ? template.contentNe || template.content : template.content;

  const handleCopy = () => {
    onCopy(displayContent, template.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-base font-bold text-gray-900 leading-snug min-w-0">{displayTitle}</h3>
        <span className="text-xs font-medium text-teal-600 whitespace-nowrap flex-shrink-0">
          {template.usageCount} uses
        </span>
      </div>

      {/* Badges + language toggle */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getBadgeClasses(template.category)}`}>
          {getCategoryLabel(template.category)}
        </span>
        {template.visibility === 'global' ? (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-green-100 text-green-800 border-green-200">
            🌐 Global
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-gray-100 text-gray-700 border-gray-200">
            🔒 Private
          </span>
        )}
        {hasNepali && (
          <div className="ml-auto inline-flex rounded-lg border border-gray-200 overflow-hidden text-[11px] font-semibold">
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-0.5 ${activeLang === 'en' ? 'bg-teal-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('ne')}
              className={`px-2 py-0.5 ${activeLang === 'ne' ? 'bg-teal-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              ने
            </button>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-200">
        <p className="text-sm text-gray-700 line-clamp-4 whitespace-pre-line">{displayContent}</p>
      </div>

      <div className="flex items-center justify-between text-[11px] text-gray-400 mb-3">
        <span className="truncate">By: {template.createdByName}</span>
        {template.createdAt && (
          <span className="flex-shrink-0">{new Date(template.createdAt).toLocaleDateString()}</span>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            copied ? 'bg-green-500 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {copied ? '✓ Copied' : `📋 Copy${hasNepali ? ` ${activeLang.toUpperCase()}` : ''}`}
        </button>
        {template.isOwner && (
          <>
            <button
              onClick={() => onEdit(template)}
              className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              aria-label="Edit template"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(template.id)}
              className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
              aria-label="Delete template"
            >
              🗑️
            </button>
          </>
        )}
      </div>
    </div>
  );
}

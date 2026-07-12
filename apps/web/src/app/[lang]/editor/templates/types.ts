import type { ApiTemplate } from '@/lib/editorApi';

/** A template is exactly what the API returns (global + own, with isOwner). */
export type Template = ApiTemplate;

export type CategoryType = 'all' | 'ad_rejection' | 'verification_rejection' | 'support' | 'suspension';

export type Visibility = 'global' | 'private';

/** Which language an editor is currently viewing/copying on a card. */
export type Lang = 'en' | 'ne';

export interface CategoryConfig {
  value: string;
  label: string;
  icon: string;
}

export interface TemplateFormData {
  title: string;
  titleNe: string;
  content: string;
  contentNe: string;
  category: string;
  visibility: Visibility;
}

export const DEFAULT_FORM_DATA: TemplateFormData = {
  title: '',
  titleNe: '',
  content: '',
  contentNe: '',
  category: 'ad_rejection',
  visibility: 'private',
};

export const CATEGORIES: CategoryConfig[] = [
  { value: 'all', label: 'All', icon: '📋' },
  { value: 'ad_rejection', label: 'Ad Rejections', icon: '🚫' },
  { value: 'verification_rejection', label: 'Verification', icon: '❌' },
  { value: 'support', label: 'Support', icon: '💬' },
  { value: 'suspension', label: 'Suspension', icon: '⚠️' },
];

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    ad_rejection: 'Ad Rejection',
    verification_rejection: 'Verification',
    support: 'Support',
    suspension: 'Suspension',
  };
  return labels[category] || category;
}

export function getCategoryBadge(category: string): string {
  const badges: Record<string, string> = {
    ad_rejection: 'bg-red-100 text-red-800 border-red-200',
    verification_rejection: 'bg-orange-100 text-orange-800 border-orange-200',
    support: 'bg-blue-100 text-blue-800 border-blue-200',
    suspension: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };
  return badges[category] || 'bg-gray-100 text-gray-800 border-gray-200';
}

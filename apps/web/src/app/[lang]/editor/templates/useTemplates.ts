'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  getTemplates,
  createTemplate as apiCreateTemplate,
  updateTemplate as apiUpdateTemplate,
  deleteTemplate as apiDeleteTemplate,
  incrementTemplateUsage,
} from '@/lib/editorApi';
import type { Template, TemplateFormData, CategoryType } from './types';

function toInput(formData: TemplateFormData) {
  return {
    title: formData.title.trim(),
    titleNe: formData.titleNe.trim() || undefined,
    content: formData.content.trim(),
    contentNe: formData.contentNe.trim() || undefined,
    category: formData.category,
    visibility: formData.visibility,
  };
}

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTemplates();
      if (res.success) {
        setTemplates(res.data || []);
      } else {
        setError(res.message || 'Failed to load templates');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createTemplate = useCallback(
    async (formData: TemplateFormData) => {
      try {
        const res = await apiCreateTemplate(toInput(formData));
        if (res.success) {
          await load();
          return true;
        }
        alert(res.message || 'Failed to create template');
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Failed to create template');
      }
      return false;
    },
    [load]
  );

  const updateTemplate = useCallback(
    async (id: number, formData: TemplateFormData) => {
      try {
        const res = await apiUpdateTemplate(id, toInput(formData));
        if (res.success) {
          await load();
          return true;
        }
        alert(res.message || 'Failed to update template');
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Failed to update template');
      }
      return false;
    },
    [load]
  );

  const deleteTemplate = useCallback(async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return false;
    try {
      const res = await apiDeleteTemplate(id);
      if (res.success) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        return true;
      }
      alert(res.message || 'Failed to delete template');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete template');
    }
    return false;
  }, []);

  /** Copy text to clipboard and record a usage (optimistic + fire-and-forget). */
  const copyTemplate = useCallback(async (content: string, id: number) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      /* clipboard may be blocked; still count the intent */
    }
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, usageCount: t.usageCount + 1 } : t))
    );
    incrementTemplateUsage(id).catch(() => {});
  }, []);

  const filterTemplates = useCallback(
    (activeCategory: CategoryType, searchTerm: string) => {
      const q = searchTerm.trim().toLowerCase();
      return templates.filter((t) => {
        const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
        const matchesSearch =
          !q ||
          t.title.toLowerCase().includes(q) ||
          t.content.toLowerCase().includes(q) ||
          (t.titleNe || '').toLowerCase().includes(q) ||
          (t.contentNe || '').toLowerCase().includes(q);
        return matchesCategory && matchesSearch;
      });
    },
    [templates]
  );

  const getStats = useCallback(() => {
    const totalUses = templates.reduce((sum, t) => sum + t.usageCount, 0);
    const sortedByUsage = [...templates].sort((a, b) => b.usageCount - a.usageCount);
    const mostUsed = sortedByUsage[0]?.title || 'N/A';
    const categoriesCount = new Set(templates.map((t) => t.category)).size;
    return {
      totalTemplates: templates.length,
      totalUses,
      mostUsed,
      categoriesCount,
    };
  }, [templates]);

  return {
    templates,
    loading,
    error,
    reload: load,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    copyTemplate,
    filterTemplates,
    getStats,
  };
}

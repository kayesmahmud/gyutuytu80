'use client';

import { use, useState } from 'react';
import { DashboardLayout } from '@/components/admin';
import { getEditorNavSections } from '@/lib/navigation';
import { useEditorAuth } from '@/hooks/useEditorAuth';
import {
  EditorLoadingScreen,
  EditorPageHeader,
  EditorStatsCard,
} from '@/components/editor';
import { CategoryTabs, TemplatesGrid, TemplateFormModal } from './components';
import { useTemplates } from './useTemplates';
import {
  CATEGORIES,
  DEFAULT_FORM_DATA,
  type CategoryType,
  type Template,
  type TemplateFormData,
} from './types';

export default function ResponseTemplatesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const { staff, authLoading, handleLogout } = useEditorAuth(lang);

  const {
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    copyTemplate,
    filterTemplates,
    getStats,
  } = useTemplates();

  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(DEFAULT_FORM_DATA);

  const filteredTemplates = filterTemplates(activeCategory, searchTerm);
  const stats = getStats();

  const handleCreateTemplate = async () => {
    if (await createTemplate(formData)) {
      setShowCreateModal(false);
      setFormData(DEFAULT_FORM_DATA);
    }
  };

  const handleEditTemplate = async () => {
    if (!selectedTemplate) return;
    if (await updateTemplate(selectedTemplate.id, formData)) {
      setShowEditModal(false);
      setSelectedTemplate(null);
      setFormData(DEFAULT_FORM_DATA);
    }
  };

  const openEditModal = (template: Template) => {
    setSelectedTemplate(template);
    setFormData({
      title: template.title,
      titleNe: template.titleNe || '',
      content: template.content,
      contentNe: template.contentNe || '',
      category: template.category,
      visibility: template.visibility,
    });
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedTemplate(null);
    setFormData(DEFAULT_FORM_DATA);
  };

  if (authLoading) {
    return <EditorLoadingScreen message="Loading templates..." />;
  }

  return (
    <DashboardLayout
      lang={lang}
      userName={staff?.fullName || 'Editor User'}
      userEmail={staff?.email || 'editor@thulobazaar.com.np'}
      navSections={getEditorNavSections(lang)}
      theme="editor"
      onLogout={handleLogout}
    >
      <div className="space-y-4 sm:space-y-6">
        <EditorPageHeader
          title="Response Templates"
          description="Reusable replies in English & Nepali — copy, share, and reuse."
          lang={lang}
          actions={
            <button
              onClick={() => {
                setFormData(DEFAULT_FORM_DATA);
                setShowCreateModal(true);
              }}
              className="w-full sm:w-auto px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors text-sm font-medium whitespace-nowrap"
            >
              + Create Template
            </button>
          }
        />

        {/* Stats — compact 2-up on mobile, 4-up on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          <EditorStatsCard compact label="Templates" value={stats.totalTemplates} icon="📋" color="blue" />
          <EditorStatsCard compact label="Total Uses" value={stats.totalUses} icon="📊" color="green" />
          <EditorStatsCard compact label="Most Used" value={stats.mostUsed} icon="⭐" color="purple" />
          <EditorStatsCard compact label="Categories" value={stats.categoriesCount} icon="🏷️" color="teal" />
        </div>

        {/* Category Tabs — horizontally scrollable on mobile */}
        <CategoryTabs
          categories={CATEGORIES}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3">
          <input
            type="text"
            placeholder="Search templates (English or Nepali)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        {/* Templates Grid / states */}
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            {error}
          </div>
        ) : loading ? (
          <div className="text-center text-gray-500 py-10 text-sm">Loading templates…</div>
        ) : (
          <TemplatesGrid
            templates={filteredTemplates}
            activeCategory={activeCategory}
            searchTerm={searchTerm}
            onCopy={copyTemplate}
            onEdit={openEditModal}
            onDelete={deleteTemplate}
          />
        )}
      </div>

      {/* Create Template Modal */}
      <TemplateFormModal
        isOpen={showCreateModal}
        onClose={closeModals}
        title="Create New Template"
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleCreateTemplate}
        submitLabel="Create Template"
      />

      {/* Edit Template Modal */}
      <TemplateFormModal
        isOpen={showEditModal && !!selectedTemplate}
        onClose={closeModals}
        title="Edit Template"
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleEditTemplate}
        submitLabel="Save Changes"
      />
    </DashboardLayout>
  );
}

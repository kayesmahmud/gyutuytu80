// @ts-nocheck
'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ImageUpload } from '@/components/forms';
import DynamicFormFields from '@/components/post-ad/DynamicFormFields';
import CascadingLocationFilter from '@/components/CascadingLocationFilter';
import { Button } from '@/components/ui';
import { usePostAd, DraftsList, PhoneVerificationBanner } from './components';

interface PostAdPageProps {
  params: Promise<{ lang: string }>;
}

export default function PostAdPage({ params }: PostAdPageProps) {
  const { lang } = use(params);
  const t = useTranslations('ads');
  const tc = useTranslations('common');

  const {
    status,
    formData,
    setFormData,
    images,
    setImages,
    categories,
    subcategories,
    loading,
    loadingSubcategories,
    error,
    submitting,
    userPhone,
    phoneVerified,
    showDrafts,
    drafts,
    isSaving,
    lastSaved,
    getDraftDisplayName,
    formatDraftDate,
    deleteDraft,
    fields,
    customFields,
    customFieldsErrors,
    selectedSubcategory,
    handleLoadDraft,
    handleStartNew,
    handleCategoryChange,
    handleCustomFieldChange,
    handleSubmit,
    isUserVerified,
  } = usePostAd(lang);

  // Image limits fetched from API settings
  const [maxImages, setMaxImages] = React.useState(isUserVerified ? 10 : 5);
  React.useEffect(() => {
    fetch('/api/ad-limits', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` } })
      .then(r => r.json())
      .then(d => { if (d.success && d.data?.userImageLimit) setMaxImages(d.data.userImageLimit); })
      .catch(() => {});
  }, []);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⏳</div>
          <p className="text-gray-500">{tc('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-[1000px] mx-auto px-4">
          <div className="flex gap-2 text-sm text-gray-500">
            <Link href={`/${lang}`} className="text-indigo-500 no-underline">
              {tc('home')}
            </Link>
            <span>/</span>
            <span>{t('postAnAd')}</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold text-gray-900 m-0">{t('postFreeAd')}</h1>
            {/* Auto-save indicator */}
            {(isSaving || lastSaved) && (
              <span
                className={`text-xs flex items-center gap-1.5 ${isSaving ? 'text-gray-500' : 'text-green-500'}`}
              >
                <span
                  className={`inline-block w-2 h-2 rounded-full ${isSaving ? 'bg-gray-500 animate-pulse' : 'bg-green-500'}`}
                />
                {isSaving ? tc('saving') : tc('draftSaved')}
              </span>
            )}
          </div>
          <p className="text-gray-500 m-0">{t('fillDetails')}</p>
        </div>

        {/* Saved Drafts List */}
        {showDrafts && (
          <DraftsList
            drafts={drafts}
            categories={categories}
            onLoadDraft={handleLoadDraft}
            onDeleteDraft={deleteDraft}
            onStartNew={handleStartNew}
            getDraftDisplayName={getDraftDisplayName}
            formatDraftDate={formatDraftDate}
          />
        )}

        {/* Show form only when not showing drafts or when drafts are dismissed */}
        {(!showDrafts || drafts.length === 0) && (
          <>
            {/* Phone Verification Banner */}
            <PhoneVerificationBanner
              lang={lang}
              phoneVerified={phoneVerified}
              userPhone={userPhone}
              loading={loading}
            />

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-300 text-red-600 p-4 rounded-lg mb-6">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm">
              {/* Ad Details */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">{t('adDetails')}</h2>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">{t('adTitle')} *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., iPhone 15 Pro Max 256GB"
                      required
                      maxLength={100}
                      className="w-full p-3 rounded-lg border border-gray-300 text-base"
                    />
                    <small className="text-gray-500">{formData.title.length}/100</small>
                  </div>

                  <div>
                    <label className="block mb-2 font-medium text-gray-700">{t('description')} *</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder={t('describeItem')}
                      required
                      rows={6}
                      maxLength={5000}
                      className="w-full p-3 rounded-lg border border-gray-300 text-base resize-y"
                    />
                    <small className="text-gray-500">{formData.description.length}/5000</small>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 font-medium text-gray-700">{t('priceNpr')} *</label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: Math.floor(Number(e.target.value)).toString() })}
                        placeholder="50000"
                        required
                        min="0"
                        step="1"
                        className="w-full p-3 rounded-lg border border-gray-300 text-base"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isNegotiable}
                        onChange={(e) =>
                          setFormData({ ...formData, isNegotiable: e.target.checked })
                        }
                        className="w-[18px] h-[18px] cursor-pointer"
                      />
                      <span className="font-medium text-gray-700">{t('priceIsNegotiable')}</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Category Selection */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">{t('category')} *</h2>

                <div className="mb-4">
                  <label className="block mb-2 font-medium text-gray-700">{t('selectCategory')} *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    required
                    className="w-full p-3 rounded-lg border border-gray-300 text-base"
                  >
                    <option value="">{t('selectMainCategory')}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon || '📦'} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.categoryId && (
                  <div className="mt-4">
                    <label className="block mb-2 font-medium text-gray-700">
                      {t('selectSubcategory')} *
                    </label>
                    <select
                      value={formData.subcategoryId}
                      onChange={(e) => setFormData({ ...formData, subcategoryId: e.target.value })}
                      disabled={loadingSubcategories}
                      required
                      className={`w-full p-3 rounded-lg border border-gray-300 text-base ${
                        loadingSubcategories ? 'bg-gray-100 cursor-wait' : 'cursor-pointer'
                      }`}
                    >
                      <option value="">
                        {loadingSubcategories
                          ? t('loadingSubcategories')
                          : t('selectSubcategoryOption')}
                      </option>
                      {!loadingSubcategories &&
                        subcategories.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Dynamic Category-Specific Fields */}
              {fields.length > 0 && (
                <DynamicFormFields
                  fields={fields}
                  values={customFields}
                  errors={customFieldsErrors}
                  onChange={handleCustomFieldChange}
                  subcategoryName={selectedSubcategory?.name}
                />
              )}

              {/* Images */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 m-0">{t('photos')} *</h2>
                  <span className="text-sm text-gray-500">
                    {t('maxImages', { count: maxImages })}
                  </span>
                </div>

                {/* Upgrade prompt for unverified users */}
                {!isUserVerified && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">✨</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-indigo-900 m-0">
                          {t('wantMoreImages', { count: MAX_IMAGES_VERIFIED })}
                        </p>
                        <p className="text-xs text-indigo-700 mt-1 mb-2">
                          {t('getVerifiedForImages')}
                        </p>
                        <Link
                          href={`/${lang}/verification`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-md no-underline transition-colors"
                        >
                          {t('getVerified')}
                          <span>→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                <ImageUpload
                  images={images}
                  onChange={setImages}
                  maxImages={maxImages}
                  maxSizeMB={5}
                />
              </div>

              {/* Location */}
              <div className="mb-8">
                <div className="border-2 border-gray-200 rounded-lg p-4">
                  <h3 className="m-0 mb-3 text-base font-semibold text-gray-900">
                    {t('locationAreaPlace')} *
                  </h3>
                  <CascadingLocationFilter
                    onLocationSelect={(locationSlug, locationName) => {
                      setFormData((prev) => ({
                        ...prev,
                        locationSlug: locationSlug || '',
                        locationName: locationName || '',
                      }));
                    }}
                    selectedLocationSlug={formData.locationSlug || null}
                    selectedLocationName={formData.locationName || null}
                  />
                  <small className="block mt-3 text-gray-500 text-xs">
                    {t('selectLocation')}
                  </small>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
                <Link
                  href={`/${lang}`}
                  className="px-8 py-3 rounded-lg border border-gray-300 bg-white no-underline text-gray-700 font-medium"
                >
                  {tc('cancel')}
                </Link>
                <Button type="submit" variant="success" loading={submitting} disabled={submitting}>
                  {submitting ? t('posting') : t('postAd')}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

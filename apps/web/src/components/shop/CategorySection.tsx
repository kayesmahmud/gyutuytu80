'use client';

import { Tag01 } from '@untitledui-pro/icons/line';
import { useShopCategory } from '@/hooks/useShopCategory';

interface CategorySectionProps {
  initialCategoryId: number | null;
  initialSubcategoryId: number | null;
  categoryName: string | null;
  subcategoryName: string | null;
  categoryIcon: string | null;
  subcategoryIcon: string | null;
  isOwner: boolean;
}

export function CategorySection({
  initialCategoryId,
  initialSubcategoryId,
  categoryName,
  subcategoryName,
  categoryIcon,
  subcategoryIcon,
  isOwner,
}: CategorySectionProps) {
  const {
    isEditing,
    setIsEditing,
    selectedCategoryId,
    selectedSubcategoryId,
    saving,
    categories,
    subcategories,
    loadingCategories,
    loadingSubcategories,
    handleCategoryChange,
    handleSubcategoryChange,
    handleSave,
    handleCancel,
  } = useShopCategory({ initialCategoryId, initialSubcategoryId });

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-semibold">Category</h2>
        {!isEditing && isOwner && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Select Your Default Category
            </label>
            <p className="text-xs text-gray-500 mb-3">
              This will be pre-selected when you post new ads.
            </p>

            <select
              value={selectedCategoryId || ''}
              onChange={(e) => handleCategoryChange(e.target.value)}
              disabled={loadingCategories}
              className="w-full p-2.5 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value="">
                {loadingCategories ? 'Loading categories...' : '-- Select Main Category --'}
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon || '📦'} {cat.name}
                </option>
              ))}
            </select>

            {selectedCategoryId && (
              <div className="mt-3">
                <select
                  value={selectedSubcategoryId || ''}
                  onChange={(e) => handleSubcategoryChange(e.target.value)}
                  disabled={loadingSubcategories}
                  className="w-full p-2.5 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  <option value="">
                    {loadingSubcategories ? 'Loading subcategories...' : '-- Select Subcategory (Optional) --'}
                  </option>
                  {subcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-3 sm:mt-4">
            <button
              onClick={handleSave}
              disabled={saving || !selectedCategoryId}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white px-3 py-2 sm:px-4 text-sm sm:text-base rounded-lg font-semibold transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex-1 border border-gray-300 px-3 py-2 sm:px-4 text-sm sm:text-base rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {categoryName ? (
            <div className="flex items-start gap-2 sm:gap-3">
              <Tag01 className="w-5 h-5 sm:w-[30px] sm:h-[30px] text-indigo-500 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-xs sm:text-sm text-gray-600">Your Default Category</div>
                <div className="font-semibold text-sm sm:text-base">
                  {subcategoryName ? (
                    <>
                      <span>{categoryIcon || '📦'} {categoryName}</span>
                      <span className="text-gray-400 mx-1">&gt;</span>
                      <span>{subcategoryIcon || ''} {subcategoryName}</span>
                    </>
                  ) : (
                    <span>{categoryIcon || '📦'} {categoryName}</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm sm:text-base text-gray-500 italic">
              No default category set. {isOwner && 'Click Edit to set your category for easier ad posting.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}


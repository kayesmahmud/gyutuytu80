import { useState, useEffect } from 'react';
import { useUserAuth } from '@/contexts/UserAuthContext';

type UserWithToken = {
  id: number;
  backendToken?: string | null;
};

interface UseShopCategoryProps {
  initialCategoryId: number | null;
  initialSubcategoryId: number | null;
}

export function useShopCategory({ initialCategoryId, initialSubcategoryId }: UseShopCategoryProps) {
  const { user } = useUserAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(initialCategoryId);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(initialSubcategoryId);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: number; name: string; icon: string | null }>>([]);
  const [subcategories, setSubcategories] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.success && data.data) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch subcategories when parent category changes
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!selectedCategoryId) {
        setSubcategories([]);
        return;
      }
      setLoadingSubcategories(true);
      try {
        const res = await fetch(`/api/categories/${selectedCategoryId}/subcategories`);
        const data = await res.json();
        if (data.success && data.data) {
          setSubcategories(data.data);
        }
      } catch (error) {
        console.error('Error fetching subcategories:', error);
      } finally {
        setLoadingSubcategories(false);
      }
    };
    if (isEditing && selectedCategoryId) {
      fetchSubcategories();
    }
  }, [selectedCategoryId, isEditing]);

  // Set initial values when editing starts
  useEffect(() => {
    if (isEditing) {
      setSelectedCategoryId(initialCategoryId);
      setSelectedSubcategoryId(initialSubcategoryId);
    }
  }, [isEditing, initialCategoryId, initialSubcategoryId]);

  const handleCategoryChange = (catId: string) => {
    const id = catId ? parseInt(catId, 10) : null;
    setSelectedCategoryId(id);
    setSelectedSubcategoryId(null);
  };

  const handleSubcategoryChange = (subId: string) => {
    const id = subId ? parseInt(subId, 10) : null;
    setSelectedSubcategoryId(id);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const token = (user as UserWithToken | null)?.backendToken;

      if (!token) {
        alert('You must be logged in to update this section. Please refresh the page and try again.');
        setSaving(false);
        return;
      }

      const response = await fetch(`/api/user/category`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          categoryId: selectedCategoryId,
          subcategoryId: selectedSubcategoryId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsEditing(false);
        window.location.reload();
      } else {
        alert(data.message || 'Failed to update category');
      }
    } catch (err) {
      console.error('Error updating category:', err);
      alert('Failed to update category');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedCategoryId(initialCategoryId);
    setSelectedSubcategoryId(initialSubcategoryId);
  };

  return {
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
  };
}


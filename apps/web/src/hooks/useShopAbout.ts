import { useState } from 'react';
import { useUserAuth } from '@/contexts/UserAuthContext';

type UserWithToken = {
  id: number;
  backendToken?: string | null;
};

interface UseShopAboutProps {
  shopSlug: string;
  initialDescription: string | null;
  bio: string | null;
}

export function useShopAbout({ shopSlug, initialDescription, bio }: UseShopAboutProps) {
  const { user } = useUserAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [aboutText, setAboutText] = useState(initialDescription || bio || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);

      const token = (user as UserWithToken | null)?.backendToken;

      if (!token) {
        alert('You must be logged in to update this section. Please refresh the page and try again.');
        setSaving(false);
        return;
      }

      const response = await fetch(`/api/shop/${shopSlug}/about`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ business_description: aboutText }),
      });

      const data = await response.json();

      if (data.success) {
        setIsEditing(false);
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        alert(data.message || 'Failed to update about section');
      }
    } catch (err) {
      console.error('Error updating about:', err);
      alert('Failed to update about section');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAboutText(initialDescription || bio || '');
  };

  return {
    isEditing,
    setIsEditing,
    aboutText,
    setAboutText,
    saving,
    handleSave,
    handleCancel,
  };
}



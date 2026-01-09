import { useState } from 'react';
import { useUserAuth } from '@/contexts/UserAuthContext';

type UserWithToken = {
  id: number;
  backendToken?: string | null;
};

interface UseShopLocationProps {
  initialLocationSlug: string | null;
  initialLocationName: string | null;
  initialLocationFullPath: string | null;
}

export function useShopLocation({
  initialLocationSlug,
  initialLocationName,
  initialLocationFullPath,
}: UseShopLocationProps) {
  const { user } = useUserAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [locationSlug, setLocationSlug] = useState(initialLocationSlug || '');
  const [locationName, setLocationName] = useState(initialLocationName || '');
  const [locationFullPath, setLocationFullPath] = useState(initialLocationFullPath || '');
  const [saving, setSaving] = useState(false);

  const handleLocationSelect = (slug: string | null, name?: string | null, fullPath?: string | null) => {
    setLocationSlug(slug || '');
    setLocationName(name || '');
    setLocationFullPath(fullPath || name || '');
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

      const response = await fetch(`/api/user/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          locationSlug: locationSlug || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsEditing(false);
        window.location.reload();
      } else {
        alert(data.message || 'Failed to update location');
      }
    } catch (err) {
      console.error('Error updating location:', err);
      alert('Failed to update location');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setLocationSlug(initialLocationSlug || '');
    setLocationName(initialLocationName || '');
    setLocationFullPath(initialLocationFullPath || '');
  };

  return {
    isEditing,
    setIsEditing,
    locationSlug,
    locationName,
    locationFullPath,
    saving,
    handleLocationSelect,
    handleSave,
    handleCancel,
  };
}


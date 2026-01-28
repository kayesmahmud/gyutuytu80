import { useState } from 'react';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { extractSocialUsername, buildSocialUrl } from '@/utils/socialMedia';

type UserWithToken = {
  id: number;
  backendToken?: string | null;
};

interface UseShopContactProps {
  shopSlug: string;
  initialBusinessPhone: string | null;
  initialWebsite: string | null;
  initialGoogleMaps: string | null;
  initialFacebook: string | null;
  initialInstagram: string | null;
  initialTiktok: string | null;
  initialPhone: string | null;
  isPhoneVerified: boolean;
}

export function useShopContact({
  shopSlug,
  initialBusinessPhone,
  initialWebsite,
  initialGoogleMaps,
  initialFacebook,
  initialInstagram,
  initialTiktok,
  initialPhone,
  isPhoneVerified,
}: UseShopContactProps) {
  const { user } = useUserAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [contactData, setContactData] = useState({
    businessPhone: initialBusinessPhone || '',
    businessWebsite: initialWebsite || '',
    googleMapsLink: initialGoogleMaps || '',
    facebookUsername: extractSocialUsername(initialFacebook, 'facebook'),
    instagramUsername: extractSocialUsername(initialInstagram, 'instagram'),
    tiktokUsername: extractSocialUsername(initialTiktok, 'tiktok'),
  });
  const [saving, setSaving] = useState(false);
  const [useVerifiedForWhatsApp, setUseVerifiedForWhatsApp] = useState(
    initialBusinessPhone === initialPhone && !!initialPhone
  );

  const verifiedPhone = initialPhone || '';

  const handleSave = async () => {
    try {
      setSaving(true);

      const token = (user as UserWithToken | null)?.backendToken;

      if (!token) {
        alert('You must be logged in to update this section. Please refresh the page and try again.');
        setSaving(false);
        return;
      }

      // Determine WhatsApp number - use verified phone if toggle is on
      let whatsAppNumber = '';
      if (useVerifiedForWhatsApp && verifiedPhone) {
        whatsAppNumber = verifiedPhone.startsWith('+977')
          ? verifiedPhone
          : `+977${verifiedPhone.replace(/\D/g, '')}`;
      } else if (contactData.businessPhone) {
        const digits = contactData.businessPhone.replace(/^\+977\s*/, '').replace(/\D/g, '');
        whatsAppNumber = digits ? `+977${digits}` : '';
      }

      const response = await fetch(`/api/shop/${shopSlug}/contact`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          business_phone: whatsAppNumber || null,
          business_website: contactData.businessWebsite,
          google_maps_link: contactData.googleMapsLink,
          facebook_url: buildSocialUrl(contactData.facebookUsername, 'facebook') || null,
          instagram_url: buildSocialUrl(contactData.instagramUsername, 'instagram') || null,
          tiktok_url: buildSocialUrl(contactData.tiktokUsername, 'tiktok') || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsEditing(false);
        window.location.reload();
      } else {
        alert(data.message || 'Failed to update contact information');
      }
    } catch (err) {
      console.error('Error updating contact:', err);
      alert('Failed to update contact information');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setContactData({
      businessPhone: initialBusinessPhone || '',
      businessWebsite: initialWebsite || '',
      googleMapsLink: initialGoogleMaps || '',
      facebookUsername: extractSocialUsername(initialFacebook, 'facebook'),
      instagramUsername: extractSocialUsername(initialInstagram, 'instagram'),
      tiktokUsername: extractSocialUsername(initialTiktok, 'tiktok'),
    });
  };

  return {
    isEditing,
    setIsEditing,
    contactData,
    setContactData,
    saving,
    useVerifiedForWhatsApp,
    setUseVerifiedForWhatsApp,
    verifiedPhone,
    isPhoneVerified,
    handleSave,
    handleCancel,
  };
}



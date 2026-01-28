'use client';

import { Phone01, Globe01, MarkerPin01 } from '@untitledui-pro/icons/line';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSquareWhatsapp, faFacebook, faInstagram, faTiktok } from '@fortawesome/free-brands-svg-icons';
import { useShopContact } from '@/hooks/useShopContact';
import { ensureHttps, buildSocialUrl } from '@/utils/socialMedia';

interface ContactSectionProps {
  shopSlug: string;
  initialBusinessPhone: string | null;
  initialWebsite: string | null;
  initialGoogleMaps: string | null;
  initialFacebook: string | null;
  initialInstagram: string | null;
  initialTiktok: string | null;
  initialPhone: string | null;
  isPhoneVerified: boolean;
  isOwner: boolean;
}

export function ContactSection({
  shopSlug,
  initialBusinessPhone,
  initialWebsite,
  initialGoogleMaps,
  initialFacebook,
  initialInstagram,
  initialTiktok,
  initialPhone,
  isPhoneVerified,
  isOwner,
}: ContactSectionProps) {
  const {
    isEditing,
    setIsEditing,
    contactData,
    setContactData,
    saving,
    useVerifiedForWhatsApp,
    setUseVerifiedForWhatsApp,
    verifiedPhone,
    handleSave,
    handleCancel,
  } = useShopContact({
    shopSlug,
    initialBusinessPhone,
    initialWebsite,
    initialGoogleMaps,
    initialFacebook,
    initialInstagram,
    initialTiktok,
    initialPhone,
    isPhoneVerified,
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-semibold">Contact Information</h2>
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
          {/* Verified Phone - Read Only */}
          {verifiedPhone && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Phone01 className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-700">Verified Mobile</span>
              </div>
              <div className="text-sm font-semibold text-gray-900">{verifiedPhone}</div>
              <p className="text-xs text-gray-500 mt-1">
                To change your verified phone, go to Profile &gt; Security tab
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              WhatsApp Number
            </label>

            {verifiedPhone && isPhoneVerified && (
              <label className="flex items-center gap-2 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useVerifiedForWhatsApp}
                  onChange={(e) => {
                    setUseVerifiedForWhatsApp(e.target.checked);
                    if (e.target.checked) {
                      setContactData({
                        ...contactData,
                        businessPhone: verifiedPhone.replace(/^\+977\s*/, ''),
                      });
                    }
                  }}
                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">
                  Same as my verified number ({verifiedPhone})
                </span>
              </label>
            )}

            <div className="flex">
              <span className="inline-flex items-center px-3 text-sm sm:text-base text-gray-600 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg">
                +977
              </span>
              <input
                type="tel"
                value={
                  useVerifiedForWhatsApp && verifiedPhone
                    ? verifiedPhone.replace(/^\+977\s*/, '').replace(/\D/g, '')
                    : contactData.businessPhone.replace(/^\+977\s*/, '')
                }
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  setContactData({ ...contactData, businessPhone: digits });
                  if (useVerifiedForWhatsApp) {
                    setUseVerifiedForWhatsApp(false);
                  }
                }}
                placeholder="98XXXXXXXX"
                maxLength={10}
                disabled={useVerifiedForWhatsApp}
                className={`flex-1 p-2.5 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent ${
                  useVerifiedForWhatsApp ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                }`}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {useVerifiedForWhatsApp
                ? 'Using your verified phone number for WhatsApp'
                : 'Enter 10-digit mobile number'}
            </p>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Website
            </label>
            <input
              type="url"
              value={contactData.businessWebsite}
              onChange={(e) => setContactData({ ...contactData, businessWebsite: e.target.value })}
              placeholder="https://example.com"
              className="w-full p-2.5 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Google Maps Link
            </label>
            <input
              type="url"
              value={contactData.googleMapsLink}
              onChange={(e) => setContactData({ ...contactData, googleMapsLink: e.target.value })}
              placeholder="https://maps.google.com/?q=..."
              className="w-full p-2.5 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Facebook
            </label>
            <div className="flex w-full">
              <span className="inline-flex items-center px-2 sm:px-3 text-xs sm:text-sm text-gray-600 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg flex-shrink-0">
                fb.com/
              </span>
              <input
                type="text"
                value={contactData.facebookUsername}
                onChange={(e) => setContactData({ ...contactData, facebookUsername: e.target.value.replace(/\s/g, '') })}
                placeholder="yourpage"
                className="min-w-0 flex-1 p-2.5 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Instagram
            </label>
            <div className="flex w-full">
              <span className="inline-flex items-center px-2 sm:px-3 text-xs sm:text-sm text-gray-600 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg flex-shrink-0">
                ig.com/
              </span>
              <input
                type="text"
                value={contactData.instagramUsername}
                onChange={(e) => setContactData({ ...contactData, instagramUsername: e.target.value.replace(/\s/g, '') })}
                placeholder="yourprofile"
                className="min-w-0 flex-1 p-2.5 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              TikTok
            </label>
            <div className="flex w-full">
              <span className="inline-flex items-center px-2 sm:px-3 text-xs sm:text-sm text-gray-600 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg flex-shrink-0">
                tiktok.com/@
              </span>
              <input
                type="text"
                value={contactData.tiktokUsername}
                onChange={(e) => setContactData({ ...contactData, tiktokUsername: e.target.value.replace(/\s/g, '').replace(/^@/, '') })}
                placeholder="yourprofile"
                className="min-w-0 flex-1 p-2.5 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-3 sm:mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
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
          {contactData.businessPhone && (
            <div className="flex items-center gap-2 sm:gap-3">
              <FontAwesomeIcon icon={faSquareWhatsapp} className="!w-5 !h-5 sm:!w-[30px] sm:!h-[30px] text-green-500 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs sm:text-sm text-gray-600">WhatsApp</div>
                <div className="font-semibold text-sm sm:text-base break-all">{contactData.businessPhone}</div>
              </div>
            </div>
          )}
          {verifiedPhone && (
            <div className="flex items-center gap-2 sm:gap-3">
              <Phone01 className="w-5 h-5 sm:w-[30px] sm:h-[30px] text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                  Mobile
                  {isPhoneVerified && (
                    <span className="inline-flex items-center gap-0.5 text-green-600 text-xs">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  )}
                </div>
                <div className="font-semibold text-sm sm:text-base break-all">{verifiedPhone}</div>
              </div>
            </div>
          )}
          {contactData.businessWebsite && (
            <div className="flex items-center gap-2 sm:gap-3">
              <Globe01 className="w-5 h-5 sm:w-[30px] sm:h-[30px] text-purple-500 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs sm:text-sm text-gray-600">Website</div>
                <a
                  href={ensureHttps(contactData.businessWebsite)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-rose-500 hover:underline font-semibold text-sm sm:text-base break-all"
                >
                  {contactData.businessWebsite}
                </a>
              </div>
            </div>
          )}
          {contactData.googleMapsLink && (
            <div className="flex items-center gap-2 sm:gap-3">
              <MarkerPin01 className="w-5 h-5 sm:w-[30px] sm:h-[30px] text-red-500 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs sm:text-sm text-gray-600">Location</div>
                <a
                  href={ensureHttps(contactData.googleMapsLink)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-rose-500 hover:underline font-semibold text-sm sm:text-base"
                >
                  View on Google Maps
                </a>
              </div>
            </div>
          )}
          {contactData.facebookUsername && (
            <div className="flex items-center gap-2 sm:gap-3">
              <FontAwesomeIcon icon={faFacebook} className="!w-5 !h-5 sm:!w-[30px] sm:!h-[30px] text-[#1877F2] flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs sm:text-sm text-gray-600">Facebook</div>
                <a
                  href={buildSocialUrl(contactData.facebookUsername, 'facebook')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-rose-500 hover:underline font-semibold text-sm sm:text-base break-all"
                >
                  {contactData.facebookUsername}
                </a>
              </div>
            </div>
          )}
          {contactData.instagramUsername && (
            <div className="flex items-center gap-2 sm:gap-3">
              <FontAwesomeIcon icon={faInstagram} className="!w-5 !h-5 sm:!w-[30px] sm:!h-[30px] text-[#E4405F] flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs sm:text-sm text-gray-600">Instagram</div>
                <a
                  href={buildSocialUrl(contactData.instagramUsername, 'instagram')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-rose-500 hover:underline font-semibold text-sm sm:text-base break-all"
                >
                  @{contactData.instagramUsername}
                </a>
              </div>
            </div>
          )}
          {contactData.tiktokUsername && (
            <div className="flex items-center gap-2 sm:gap-3">
              <FontAwesomeIcon icon={faTiktok} className="!w-5 !h-5 sm:!w-[30px] sm:!h-[30px] text-black flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs sm:text-sm text-gray-600">TikTok</div>
                <a
                  href={buildSocialUrl(contactData.tiktokUsername, 'tiktok')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-rose-500 hover:underline font-semibold text-sm sm:text-base break-all"
                >
                  @{contactData.tiktokUsername}
                </a>
              </div>
            </div>
          )}
          {!contactData.businessPhone && !verifiedPhone && !contactData.businessWebsite && !contactData.googleMapsLink && !contactData.facebookUsername && !contactData.instagramUsername && !contactData.tiktokUsername && (
            <p className="text-sm sm:text-base text-gray-500 italic">
              No contact information available. {isOwner && 'Click Edit to add your contact details.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}



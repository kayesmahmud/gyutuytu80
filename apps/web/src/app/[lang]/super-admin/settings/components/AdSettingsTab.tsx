'use client';

import type { SystemSettings } from './types';

interface AdSettingsTabProps {
  settings: SystemSettings;
  updateSettings: (updates: Partial<SystemSettings>) => void;
}

// Value restored when the expiry toggle is switched back on (0 = never expires)
const DEFAULT_EXPIRY_DAYS = 365;

export function AdSettingsTab({ settings, updateSettings }: AdSettingsTabProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Ad Settings</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Ads - Verified Users
            <span className="ml-2 text-xs text-green-600 font-normal">✓ Business or Individual</span>
          </label>
          <input
            type="number"
            value={settings.maxAdsPerUser}
            onChange={(e) => updateSettings({ maxAdsPerUser: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Active ad limit for verified business or individual users</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Ad Expiry</label>
            <button
              type="button"
              role="switch"
              aria-checked={settings.adExpiryDays > 0}
              onClick={() =>
                updateSettings({ adExpiryDays: settings.adExpiryDays > 0 ? 0 : DEFAULT_EXPIRY_DAYS })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.adExpiryDays > 0 ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.adExpiryDays > 0 ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {settings.adExpiryDays > 0 ? (
            <>
              <input
                type="number"
                min={1}
                value={settings.adExpiryDays}
                onChange={(e) =>
                  updateSettings({ adExpiryDays: parseInt(e.target.value) || DEFAULT_EXPIRY_DAYS })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Days from post date until an ad expires — applied to ALL ads on save
              </p>
            </>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              Off — ads never expire (applied to ALL ads on save)
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Ads - Unverified Users
            <span className="ml-2 text-xs text-orange-600 font-normal">○ Not verified</span>
          </label>
          <input
            type="number"
            value={settings.freeAdsLimit}
            onChange={(e) => updateSettings({ freeAdsLimit: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Active ad limit for users without verification</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Images Per Ad (Legacy)</label>
          <input
            type="number"
            value={settings.maxImagesPerAd}
            onChange={(e) => updateSettings({ maxImagesPerAd: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Fallback limit (used if user-specific limits not set)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Images - Verified Users
            <span className="ml-2 text-xs text-green-600 font-normal">✓ Business or Individual</span>
          </label>
          <input
            type="number"
            value={settings.maxImagesVerified}
            onChange={(e) => updateSettings({ maxImagesVerified: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Image limit for verified business or individual users</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Images - Unverified Users
            <span className="ml-2 text-xs text-orange-600 font-normal">○ Not verified</span>
          </label>
          <input
            type="number"
            value={settings.maxImagesUnverified}
            onChange={(e) => updateSettings({ maxImagesUnverified: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Image limit for users without verification</p>
        </div>
      </div>
    </div>
  );
}

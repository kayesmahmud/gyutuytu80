'use client';

import { useState } from 'react';
import type { SystemSettings } from './types';
import { ToggleRow } from './ToggleSwitch';

interface GoogleAdsSettingsTabProps {
  settings: SystemSettings;
  updateSettings: (updates: Partial<SystemSettings>) => void;
}

function SlotInput({
  label,
  value,
  hint,
  onChange,
}: {
  label: string;
  value: string;
  hint: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. 1234567890"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-mono"
      />
      <p className="text-xs text-gray-500 mt-1">{hint}</p>
    </div>
  );
}

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        {title}
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-4 pb-4 space-y-4">{children}</div>}
    </div>
  );
}

export function GoogleAdsSettingsTab({ settings, updateSettings }: GoogleAdsSettingsTabProps) {
  return (
    <div className="space-y-6">
      {/* Master Toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Google Ads</h2>
        <ToggleRow
          title="Enable Google Ads"
          description="Master switch for all Google Ads across web and mobile"
          checked={settings.googleAdsEnabled}
          onChange={(v) => updateSettings({ googleAdsEnabled: v })}
        />
      </div>

      {/* Web AdSense Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Web (Google AdSense)</h2>
        <p className="text-sm text-gray-600">
          Configure your AdSense publisher ID and ad slot IDs for the website.
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            AdSense Publisher ID
          </label>
          <input
            type="text"
            value={settings.adsenseClientId}
            onChange={(e) => updateSettings({ adsenseClientId: e.target.value })}
            placeholder="ca-pub-XXXXXXXXXXXXXXXX"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
          />
          <p className="text-xs text-gray-500 mt-1">
            Your Google AdSense publisher ID (starts with ca-pub-)
          </p>
        </div>

        {/* Home Page Slots */}
        <CollapsibleSection title="Home Page Slots (6)" defaultOpen>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SlotInput
              label="Hero Banner (Desktop)"
              value={settings.adSlotHomeHeroBanner}
              hint="728x90 below hero section"
              onChange={(v) => updateSettings({ adSlotHomeHeroBanner: v })}
            />
            <SlotInput
              label="Hero Banner (Mobile)"
              value={settings.adSlotHomeHeroBannerMobile}
              hint="320x100 below hero section"
              onChange={(v) => updateSettings({ adSlotHomeHeroBannerMobile: v })}
            />
            <SlotInput
              label="Left Sidebar"
              value={settings.adSlotHomeLeft}
              hint="160x600 left sidebar (XL screens)"
              onChange={(v) => updateSettings({ adSlotHomeLeft: v })}
            />
            <SlotInput
              label="Right Sidebar"
              value={settings.adSlotHomeRight}
              hint="160x600 right sidebar (XL screens)"
              onChange={(v) => updateSettings({ adSlotHomeRight: v })}
            />
            <SlotInput
              label="In-Feed"
              value={settings.adSlotHomeInFeed}
              hint="300x250 between ad listings"
              onChange={(v) => updateSettings({ adSlotHomeInFeed: v })}
            />
            <SlotInput
              label="Bottom"
              value={settings.adSlotHomeBottom}
              hint="336x280 before footer"
              onChange={(v) => updateSettings({ adSlotHomeBottom: v })}
            />
          </div>
        </CollapsibleSection>

        {/* Ad Detail Slots */}
        <CollapsibleSection title="Ad Detail Page Slots (5)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SlotInput
              label="Top Banner (Desktop)"
              value={settings.adSlotAdDetailTop}
              hint="728x90 above images"
              onChange={(v) => updateSettings({ adSlotAdDetailTop: v })}
            />
            <SlotInput
              label="Top Banner (Mobile)"
              value={settings.adSlotAdDetailTopMobile}
              hint="320x100 above images"
              onChange={(v) => updateSettings({ adSlotAdDetailTopMobile: v })}
            />
            <SlotInput
              label="Left Sidebar"
              value={settings.adSlotAdDetailLeft}
              hint="160x600 left sidebar"
              onChange={(v) => updateSettings({ adSlotAdDetailLeft: v })}
            />
            <SlotInput
              label="Right Sidebar"
              value={settings.adSlotAdDetailRight}
              hint="160x600 right sidebar"
              onChange={(v) => updateSettings({ adSlotAdDetailRight: v })}
            />
            <SlotInput
              label="Bottom"
              value={settings.adSlotAdDetailBottom}
              hint="336x280 below content"
              onChange={(v) => updateSettings({ adSlotAdDetailBottom: v })}
            />
          </div>
        </CollapsibleSection>

        {/* Search/Listing Slots */}
        <CollapsibleSection title="Search / Listing Page Slots (5)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SlotInput
              label="Top Banner (Desktop)"
              value={settings.adSlotAdsListingTop}
              hint="728x90 above breadcrumb"
              onChange={(v) => updateSettings({ adSlotAdsListingTop: v })}
            />
            <SlotInput
              label="Top Banner (Mobile)"
              value={settings.adSlotAdsListingTopMobile}
              hint="320x100 above breadcrumb"
              onChange={(v) => updateSettings({ adSlotAdsListingTopMobile: v })}
            />
            <SlotInput
              label="Sidebar"
              value={settings.adSlotAdsListingSidebar}
              hint="300x250 below filters"
              onChange={(v) => updateSettings({ adSlotAdsListingSidebar: v })}
            />
            <SlotInput
              label="In-Feed"
              value={settings.adSlotAdsListingInFeed}
              hint="300x250 between results"
              onChange={(v) => updateSettings({ adSlotAdsListingInFeed: v })}
            />
            <SlotInput
              label="Bottom"
              value={settings.adSlotAdsListingBottom}
              hint="336x280 after pagination"
              onChange={(v) => updateSettings({ adSlotAdsListingBottom: v })}
            />
          </div>
        </CollapsibleSection>

        {/* Search Slots */}
        <CollapsibleSection title="Search Results Page Slots (5)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SlotInput
              label="Top Banner (Desktop)"
              value={settings.adSlotSearchTop}
              hint="728x90 inline with title"
              onChange={(v) => updateSettings({ adSlotSearchTop: v })}
            />
            <SlotInput
              label="Top Banner (Mobile)"
              value={settings.adSlotSearchTopMobile}
              hint="320x100 inline with title"
              onChange={(v) => updateSettings({ adSlotSearchTopMobile: v })}
            />
            <SlotInput
              label="Sidebar"
              value={settings.adSlotSearchSidebar}
              hint="300x250 below filters"
              onChange={(v) => updateSettings({ adSlotSearchSidebar: v })}
            />
            <SlotInput
              label="In-Results"
              value={settings.adSlotSearchInResults}
              hint="300x250 between results"
              onChange={(v) => updateSettings({ adSlotSearchInResults: v })}
            />
            <SlotInput
              label="Bottom"
              value={settings.adSlotSearchBottom}
              hint="336x280 after pagination"
              onChange={(v) => updateSettings({ adSlotSearchBottom: v })}
            />
          </div>
        </CollapsibleSection>

        {/* Other Page Slots */}
        <CollapsibleSection title="Other Pages (2)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SlotInput
              label="Dashboard Sidebar"
              value={settings.adSlotDashboardSidebar}
              hint="300x250 on dashboard"
              onChange={(v) => updateSettings({ adSlotDashboardSidebar: v })}
            />
            <SlotInput
              label="Profile Sidebar"
              value={settings.adSlotProfileSidebar}
              hint="300x250 on profile"
              onChange={(v) => updateSettings({ adSlotProfileSidebar: v })}
            />
          </div>
        </CollapsibleSection>
      </div>

      {/* Mobile AdMob Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Mobile (Google AdMob)</h2>
        <p className="text-sm text-gray-600">
          Configure AdMob App IDs and ad unit IDs for the Flutter mobile app.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Android App ID
            </label>
            <input
              type="text"
              value={settings.admobAppIdAndroid}
              onChange={(e) => updateSettings({ admobAppIdAndroid: e.target.value })}
              placeholder="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">AdMob App ID for Android</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              iOS App ID
            </label>
            <input
              type="text"
              value={settings.admobAppIdIos}
              onChange={(e) => updateSettings({ admobAppIdIos: e.target.value })}
              placeholder="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">AdMob App ID for iOS</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Android Banner Ad Unit ID
            </label>
            <input
              type="text"
              value={settings.admobBannerAndroid}
              onChange={(e) => updateSettings({ admobBannerAndroid: e.target.value })}
              placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">Banner ad unit ID for Android</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              iOS Banner Ad Unit ID
            </label>
            <input
              type="text"
              value={settings.admobBannerIos}
              onChange={(e) => updateSettings({ admobBannerIos: e.target.value })}
              placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">Banner ad unit ID for iOS</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <strong>Note:</strong> AdMob App IDs in AndroidManifest.xml and Info.plist are set at build time.
          The ad unit IDs configured here are fetched at runtime by the mobile app.
        </div>
      </div>
    </div>
  );
}

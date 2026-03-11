'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  supportPhone: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'Thulo Bazaar',
  siteDescription: "Nepal's Leading Marketplace",
  contactEmail: 'support@thulobazaar.com',
  supportPhone: '+977-1-1234567',
};

const SiteSettingsContext = createContext<SiteSettings>(DEFAULT_SETTINGS);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    fetch('/api/settings/public')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setSettings({
            siteName: json.data.siteName || DEFAULT_SETTINGS.siteName,
            siteDescription: json.data.siteDescription || DEFAULT_SETTINGS.siteDescription,
            contactEmail: json.data.contactEmail || DEFAULT_SETTINGS.contactEmail,
            supportPhone: json.data.supportPhone || DEFAULT_SETTINGS.supportPhone,
          });
        }
      })
      .catch((err) => {
        console.error('Failed to load site settings:', err);
      });
  }, []);

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}

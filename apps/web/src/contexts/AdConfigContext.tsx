'use client';

import { createContext, useContext, ReactNode } from 'react';

export interface AdConfig {
  enabled: boolean;
  clientId: string;
  slots: Record<string, string>;
}

const DEFAULT_AD_CONFIG: AdConfig = {
  enabled: false,
  clientId: '',
  slots: {},
};

const AdConfigContext = createContext<AdConfig>(DEFAULT_AD_CONFIG);

export function AdConfigProvider({
  config,
  children,
}: {
  config: AdConfig;
  children: ReactNode;
}) {
  return (
    <AdConfigContext.Provider value={config}>
      {children}
    </AdConfigContext.Provider>
  );
}

export function useAdConfig() {
  return useContext(AdConfigContext);
}

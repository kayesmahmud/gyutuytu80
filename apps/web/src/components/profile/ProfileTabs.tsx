'use client';

import { useTranslations } from 'next-intl';

export type TabType = 'profile' | 'security' | 'shop' | 'billing' | 'saved';

interface Tab {
  id: TabType;
  labelKey: string;
  icon: React.ReactNode;
  badge?: number;
  hidden?: boolean;
}

interface ProfileTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  showShopTab: boolean;
  savedCount: number;
}

export function ProfileTabs({
  activeTab,
  onTabChange,
  showShopTab,
  savedCount,
}: ProfileTabsProps) {
  const t = useTranslations('profile');

  const tabs: Tab[] = [
    {
      id: 'profile',
      labelKey: 'tabProfile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'security',
      labelKey: 'tabSecurity',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      id: 'shop',
      labelKey: 'tabShop',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      hidden: !showShopTab,
    },
    {
      id: 'billing',
      labelKey: 'tabBilling',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
        </svg>
      ),
    },
    {
      id: 'saved',
      labelKey: 'tabSaved',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      badge: savedCount,
    },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="flex">
        {tabs
          .filter((tab) => !tab.hidden)
          .map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                {tab.icon}
                <span className="hidden sm:inline">{t(tab.labelKey)}</span>
                {tab.badge !== undefined && (
                  <>
                    <span className="hidden sm:inline">({tab.badge})</span>
                    <span className="sm:hidden text-xs">{tab.badge}</span>
                  </>
                )}
              </span>
            </button>
          ))}
      </nav>
    </div>
  );
}

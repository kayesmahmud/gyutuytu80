'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { AboutSection } from '@/components/shop/AboutSection';
import { ContactSection } from '@/components/shop/ContactSection';
import { CategorySection } from '@/components/shop/CategorySection';
import { LocationSection } from '@/components/shop/LocationSection';
import ReportShopButton from './ReportShopButton';

type ShopTab = 'about' | 'contact' | 'categories' | 'location';

const TAB_ICONS: Record<ShopTab, React.ReactNode> = {
  about: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  contact: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  categories: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  location: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

const TAB_IDS: ShopTab[] = ['about', 'contact', 'categories', 'location'];

interface ShopSidebarProps {
  shopId: number;
  shopSlug: string;
  shopName: string;
  lang: string;
  bio: string | null;
  businessDescription: string | null;
  businessPhone: string | null;
  phone: string | null;
  phoneVerified?: boolean;
  businessWebsite: string | null;
  googleMapsLink: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  locationName: string | null;
  locationSlug: string | null;
  locationFullPath: string | null;
  // Category props (main category)
  categoryId: number | null;
  categoryName: string | null;
  categorySlug: string | null;
  categoryIcon: string | null;
  // Subcategory props
  subcategoryId: number | null;
  subcategoryName: string | null;
  subcategorySlug: string | null;
  subcategoryIcon: string | null;
}

export default function ShopSidebar({
  shopId,
  shopSlug,
  shopName,
  lang,
  bio,
  businessDescription: initialDescription,
  businessPhone: initialBusinessPhone,
  phone: initialPhone,
  phoneVerified: initialPhoneVerified = false,
  businessWebsite: initialWebsite,
  googleMapsLink: initialGoogleMaps,
  facebookUrl: initialFacebook,
  instagramUrl: initialInstagram,
  tiktokUrl: initialTiktok,
  locationName: initialLocationName,
  locationSlug: initialLocationSlug,
  locationFullPath: initialLocationFullPath,
  categoryId: initialCategoryId,
  categoryName: initialCategoryName,
  categorySlug: initialCategorySlug,
  categoryIcon: initialCategoryIcon,
  subcategoryId: initialSubcategoryId,
  subcategoryName: initialSubcategoryName,
  subcategorySlug: initialSubcategorySlug,
  subcategoryIcon: initialSubcategoryIcon,
}: ShopSidebarProps) {
  const t = useTranslations('shop');
  const { user, isAuthenticated } = useUserAuth();
  const [isOwner, setIsOwner] = useState(false);
  const [activeTab, setActiveTab] = useState<ShopTab>('about');

  const tabLabels: Record<ShopTab, string> = {
    about: t('about'),
    contact: t('contact'),
    categories: t('categories'),
    location: t('location'),
  };

  // Determine if current user is the shop owner
  useEffect(() => {
    if (isAuthenticated && user) {
      setIsOwner(user.id === shopId);
    }
  }, [user, isAuthenticated, shopId]);

  // Render section content based on tab
  const renderTabContent = (tab: ShopTab) => {
    switch (tab) {
      case 'about':
        return (
          <AboutSection
            shopSlug={shopSlug}
            initialDescription={initialDescription}
            bio={bio}
            isOwner={isOwner}
          />
        );
      case 'contact':
        return (
          <ContactSection
            shopSlug={shopSlug}
            initialBusinessPhone={initialBusinessPhone}
            initialWebsite={initialWebsite}
            initialGoogleMaps={initialGoogleMaps}
            initialFacebook={initialFacebook}
            initialInstagram={initialInstagram}
            initialTiktok={initialTiktok}
            initialPhone={initialPhone}
            isPhoneVerified={initialPhoneVerified}
            isOwner={isOwner}
          />
        );
      case 'categories':
        return (
          <CategorySection
            initialCategoryId={initialCategoryId}
            initialSubcategoryId={initialSubcategoryId}
            categoryName={initialCategoryName}
            subcategoryName={initialSubcategoryName}
            categoryIcon={initialCategoryIcon}
            subcategoryIcon={initialSubcategoryIcon}
            isOwner={isOwner}
          />
        );
      case 'location':
        return (
          <LocationSection
            initialLocationSlug={initialLocationSlug}
            initialLocationName={initialLocationName}
            initialLocationFullPath={initialLocationFullPath}
            isOwner={isOwner}
          />
        );
    }
  };

  return (
    <>
      {/* ===== MOBILE VIEW: 4-Tab Navigation ===== */}
      <div className="lg:hidden">
        {/* Sticky Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4 sticky top-0 z-10">
          <div className="flex">
            {TAB_IDS.map((tabId) => (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className={`flex-1 py-3 text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === tabId
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-gray-500 border-b-2 border-transparent hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center justify-center gap-1">
                  <span className="hidden sm:inline">{TAB_ICONS[tabId]}</span>
                  {tabLabels[tabId]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-6">
          {renderTabContent(activeTab)}
        </div>

      </div>

      {/* ===== DESKTOP VIEW: Stacked Sidebar ===== */}
      <div className="hidden lg:block space-y-4 sm:space-y-5 md:space-y-6">
        <AboutSection
          shopSlug={shopSlug}
          initialDescription={initialDescription}
          bio={bio}
          isOwner={isOwner}
        />

        <ContactSection
          shopSlug={shopSlug}
          initialBusinessPhone={initialBusinessPhone}
          initialWebsite={initialWebsite}
          initialGoogleMaps={initialGoogleMaps}
          initialFacebook={initialFacebook}
          initialInstagram={initialInstagram}
          initialTiktok={initialTiktok}
          initialPhone={initialPhone}
          isPhoneVerified={initialPhoneVerified}
          isOwner={isOwner}
        />

        <CategorySection
          initialCategoryId={initialCategoryId}
          initialSubcategoryId={initialSubcategoryId}
          categoryName={initialCategoryName}
          subcategoryName={initialSubcategoryName}
          categoryIcon={initialCategoryIcon}
          subcategoryIcon={initialSubcategoryIcon}
          isOwner={isOwner}
        />

        <LocationSection
          initialLocationSlug={initialLocationSlug}
          initialLocationName={initialLocationName}
          initialLocationFullPath={initialLocationFullPath}
          isOwner={isOwner}
        />

        {/* Report Shop Button - Only show for non-owners */}
        {!isOwner && (
          <div className="card flex justify-center">
            <ReportShopButton
              shopId={shopId}
              shopName={shopName}
              lang={lang}
            />
          </div>
        )}
      </div>
    </>
  );
}

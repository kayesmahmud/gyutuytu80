'use client';

import { EmptyAds } from '@/components/ui';
import { AdItem } from './AdItem';
import type { Ad, AdTab } from './types';

interface AdsListProps {
  userAds: Ad[];
  filteredAds: Ad[];
  paginatedAds: Ad[];
  activeTab: AdTab;
  lang: string;
  currentPage: number;
  totalPages: number;
  onTabChange: (tab: AdTab) => void;
  onPageChange: (page: number) => void;
  onDelete: (adId: number) => Promise<void>;
}

const TAB_CONFIG: Array<{
  id: AdTab;
  label: string;
  activeGradient: string;
  activeShadow: string;
  icon: React.ReactNode;
}> = [
  {
    id: 'active',
    label: 'Active',
    activeGradient: 'from-green-500 to-emerald-600',
    activeShadow: 'shadow-green-500/30',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    id: 'pending',
    label: 'Pending',
    activeGradient: 'from-amber-500 to-orange-600',
    activeShadow: 'shadow-amber-500/30',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    id: 'rejected',
    label: 'Rejected',
    activeGradient: 'from-red-500 to-rose-600',
    activeShadow: 'shadow-red-500/30',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  {
    id: 'sold',
    label: 'Sold',
    activeGradient: 'from-indigo-500 to-purple-600',
    activeShadow: 'shadow-indigo-500/30',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
];

function getAdCountByStatus(ads: Ad[], status: AdTab): number {
  return ads.filter((ad) => ad.status === status).length;
}

export function AdsList({
  userAds,
  filteredAds,
  paginatedAds,
  activeTab,
  lang,
  currentPage,
  totalPages,
  onTabChange,
  onPageChange,
  onDelete,
}: AdsListProps) {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden border border-gray-100">
      {/* Header Section */}
      <div className="px-4 sm:px-8 pt-4 sm:pt-8 pb-4 sm:pb-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-0.5 sm:mb-1">My Listings</h2>
            <p className="text-sm sm:text-base text-gray-600">Manage and track all your advertisements</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="font-medium">{userAds.length} Total Ads</span>
          </div>
        </div>

        {/* Modern Tabs - 2x2 grid on mobile, flex wrap on desktop */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`group relative w-full sm:w-auto px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold cursor-pointer transition-all duration-300 text-xs sm:text-base ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.activeGradient} text-white shadow-lg ${tab.activeShadow}`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2">
                <span className="[&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5">{tab.icon}</span>
                {tab.label} ({getAdCountByStatus(userAds, tab.id)})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Ads Grid */}
      <div className="p-4 sm:p-6">
        {filteredAds.length === 0 ? (
          <EmptyAds lang={lang} />
        ) : (
          <>
            <div className="space-y-4">
              {paginatedAds.map((ad) => (
                <AdItem
                  key={ad.id}
                  ad={ad}
                  lang={lang}
                  onDelete={onDelete}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * 10 + 1} to{' '}
                  {Math.min(currentPage * 10, filteredAds.length)} of {filteredAds.length} ads
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first, last, current, and adjacent pages
                      const showPage =
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1;
                      const showEllipsis =
                        (page === 2 && currentPage > 3) ||
                        (page === totalPages - 1 && currentPage < totalPages - 2);

                      if (!showPage && !showEllipsis) return null;
                      if (showEllipsis && !showPage) {
                        return (
                          <span key={page} className="px-2 text-gray-400">
                            ...
                          </span>
                        );
                      }

                      return (
                        <button
                          key={page}
                          onClick={() => onPageChange(page)}
                          className={`w-9 h-9 text-sm font-medium rounded-lg transition-colors ${
                            currentPage === page
                              ? 'bg-indigo-600 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

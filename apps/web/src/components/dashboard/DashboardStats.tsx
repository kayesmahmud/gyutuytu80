'use client';

import type { DashboardStats as Stats } from './types';

interface DashboardStatsProps {
  stats: Stats;
  lang: string;
  inline?: boolean;
}

// Format large numbers: 1000 → 1k, 10000 → 10k, 1000000 → 1M
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + 'k';
  }
  return num.toString();
}

export function DashboardStats({ stats, lang, inline = false }: DashboardStatsProps) {
  // Inline mode: compact cards for header placement
  if (inline) {
    return (
      <div className="grid grid-cols-3 gap-2 md:gap-3 w-full md:w-auto md:flex">
        {/* Total Ads */}
        <div className="bg-white rounded-lg md:rounded-xl p-2.5 md:p-4 shadow-lg border border-gray-100 md:min-w-[140px]">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <div className="text-lg md:text-2xl font-bold text-gray-800" title={stats.totalAds.toLocaleString()}>
                {formatNumber(stats.totalAds)}
              </div>
              <div className="text-[10px] md:text-xs text-gray-500 font-medium">Total</div>
            </div>
          </div>
        </div>

        {/* Active Ads */}
        <div className="bg-white rounded-lg md:rounded-xl p-2.5 md:p-4 shadow-lg border border-gray-100 md:min-w-[140px]">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-lg md:text-2xl font-bold text-gray-800" title={stats.activeAds.toLocaleString()}>
                {formatNumber(stats.activeAds)}
              </div>
              <div className="text-[10px] md:text-xs text-gray-500 font-medium">Active</div>
            </div>
          </div>
        </div>

        {/* Total Views */}
        <div className="bg-white rounded-lg md:rounded-xl p-2.5 md:p-4 shadow-lg border border-gray-100 md:min-w-[140px]">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <div className="text-lg md:text-2xl font-bold text-gray-800" title={stats.totalViews.toLocaleString()}>
                {formatNumber(stats.totalViews)}
              </div>
              <div className="text-[10px] md:text-xs text-gray-500 font-medium">Views</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default mode: full cards with overlap effect
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-6 -mt-8 mb-6 sm:mb-12 relative z-20">
      {/* Total Ads Card */}
      <div className="group bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg sm:shadow-xl hover:shadow-2xl transition-all duration-300 sm:hover:-translate-y-2 border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:mb-4">
          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md sm:shadow-lg group-hover:scale-110 transition-transform duration-300 mx-auto sm:mx-0 mb-2 sm:mb-0">
            <svg className="w-5 h-5 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-center sm:text-right">
            <div className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent" title={stats.totalAds.toLocaleString()}>
              {formatNumber(stats.totalAds)}
            </div>
          </div>
        </div>
        <div className="text-[10px] sm:text-sm font-semibold text-gray-600 uppercase tracking-wide text-center sm:text-left">Total Ads</div>
        <div className="hidden sm:block mt-2 text-xs text-gray-500">All your listings</div>
      </div>

      {/* Active Ads Card */}
      <div className="group bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg sm:shadow-xl hover:shadow-2xl transition-all duration-300 sm:hover:-translate-y-2 border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:mb-4">
          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md sm:shadow-lg group-hover:scale-110 transition-transform duration-300 mx-auto sm:mx-0 mb-2 sm:mb-0">
            <svg className="w-5 h-5 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-center sm:text-right">
            <div className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent" title={stats.activeAds.toLocaleString()}>
              {formatNumber(stats.activeAds)}
            </div>
          </div>
        </div>
        <div className="text-[10px] sm:text-sm font-semibold text-gray-600 uppercase tracking-wide text-center sm:text-left">Active Ads</div>
        <div className="hidden sm:block mt-2 text-xs text-gray-500">Currently live</div>
      </div>

      {/* Total Views Card */}
      <div className="group bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg sm:shadow-xl hover:shadow-2xl transition-all duration-300 sm:hover:-translate-y-2 border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:mb-4">
          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md sm:shadow-lg group-hover:scale-110 transition-transform duration-300 mx-auto sm:mx-0 mb-2 sm:mb-0">
            <svg className="w-5 h-5 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <div className="text-center sm:text-right">
            <div className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" title={stats.totalViews.toLocaleString()}>
              {formatNumber(stats.totalViews)}
            </div>
          </div>
        </div>
        <div className="text-[10px] sm:text-sm font-semibold text-gray-600 uppercase tracking-wide text-center sm:text-left">Total Views</div>
        <div className="hidden sm:block mt-2 text-xs text-gray-500">People interested</div>
      </div>
    </div>
  );
}

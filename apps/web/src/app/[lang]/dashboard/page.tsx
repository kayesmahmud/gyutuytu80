'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  IndividualVerificationForm,
  BusinessVerificationForm,
} from '@/components/verification';
import { DashboardStats, AdsList, useDashboardData } from '@/components/dashboard';

export default function DashboardPage() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || 'en';

  const {
    session,
    status,
    activeTab,
    userAds,
    filteredAds,
    loading,
    error,
    stats,
    verificationStatus,
    showResubmitModal,
    resubmitType,
    setActiveTab,
    handleDeleteAd,
    handleMarkAsSold,
    openResubmitModal,
    closeResubmitModal,
    loadUserData,
    success,
  } = useDashboardData();

  // Show loading state while checking authentication
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            {/* Animated Loading Circle */}
            <div className="w-24 h-24 mx-auto">
              <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
              <div className="relative w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl">
                <svg className="w-12 h-12 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Your Dashboard</h2>
          <p className="text-white/80">Please wait while we fetch your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 relative z-10">
          {/* Breadcrumb - Hidden visually but kept for SEO/accessibility */}
          <nav aria-label="Breadcrumb" className="sr-only">
            <ol>
              <li>
                <Link href={`/${lang}`}>Home</Link>
              </li>
              <li aria-current="page">Dashboard</li>
            </ol>
          </nav>

          {/* Header with Stats - Title left, Stats right */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="md:flex-shrink-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/90">
                My Dashboard
              </h1>
              <p className="text-sm md:text-base text-white/80">
                Welcome back, <span className="font-semibold">{session?.user?.name}</span>!
              </p>
            </div>

            {/* Stats Cards - Centered in remaining space */}
            <div className="md:flex-1 md:flex md:justify-center">
              <DashboardStats stats={stats} lang={lang} inline />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8 md:pb-12">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-300 text-red-700 p-4 rounded-2xl shadow-lg animate-pulse mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Ads List */}
        <AdsList
          userAds={userAds}
          filteredAds={filteredAds}
          activeTab={activeTab}
          lang={lang}
          onTabChange={setActiveTab}
          onDelete={handleDeleteAd}
          onMarkAsSold={handleMarkAsSold}
        />
      </div>

      {/* Resubmission Modal */}
      {showResubmitModal &&
        resubmitType &&
        (resubmitType === 'individual' ? (
          <IndividualVerificationForm
            onSuccess={() => {
              closeResubmitModal();
              success('Verification resubmitted successfully! We will review your application.');
              loadUserData();
            }}
            onCancel={closeResubmitModal}
            durationDays={
              (verificationStatus?.individualVerification?.request as any)?.durationDays || 365
            }
            price={0}
            isFreeVerification={true}
            isResubmission={true}
          />
        ) : (
          <BusinessVerificationForm
            onSuccess={() => {
              closeResubmitModal();
              success('Verification resubmitted successfully! We will review your application.');
              loadUserData();
            }}
            onCancel={closeResubmitModal}
            durationDays={
              (verificationStatus?.businessVerification?.request as any)?.durationDays || 365
            }
            price={0}
            isFreeVerification={true}
            isResubmission={true}
          />
        ))}
    </div>
  );
}

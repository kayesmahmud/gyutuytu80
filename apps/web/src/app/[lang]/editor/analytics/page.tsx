'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getEditorNavSections } from '@/lib/navigation';
import { getEditorAnalytics } from '@/lib/editorApi';
import {
  BarChart,
  LineChart,
  PieChart,
  Heatmap,
  OverviewStats,
  InsightsSection,
} from './components';
import type { AnalyticsData, TimeRange } from './types';

const EMPTY_ANALYTICS: AnalyticsData = {
  overview: {
    totalAdsReviewed: 0,
    totalAdsApproved: 0,
    totalAdsRejected: 0,
    totalVerifications: 0,
    avgResponseTime: 0,
    approvalRate: 0,
  },
  dailyStats: [],
  categoryBreakdown: [],
  rejectionReasons: [],
  hourlyActivity: Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 })),
};

export default function ModerationAnalyticsPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isEditor, logout } = useStaffAuth();

  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>(EMPTY_ANALYTICS);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/editor/login`);
  }, [logout, router, params.lang]);

  const loadAnalytics = useCallback(async (range: TimeRange) => {
    setLoading(true);
    try {
      const response = await getEditorAnalytics(range);
      if (response.success) {
        setAnalytics(response.data);
      } else {
        setAnalytics(EMPTY_ANALYTICS);
      }
    } catch (error) {
      console.warn('[Analytics] Failed to load:', error);
      setAnalytics(EMPTY_ANALYTICS);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!staff || !isEditor) {
      router.push(`/${params.lang}/editor/login`);
      return;
    }
    loadAnalytics(timeRange);
  }, [authLoading, staff, isEditor, params.lang, router, timeRange, loadAnalytics]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-ping opacity-20" />
              <div className="relative w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-4xl text-white">⏳</span>
              </div>
            </div>
            <div className="text-lg font-semibold text-gray-700">Loading analytics...</div>
          </div>
        </div>
      </div>
    );
  }

  const pieChartColors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-500', 'bg-pink-500'];

  return (
    <DashboardLayout
      lang={params.lang}
      userName={staff?.fullName || 'Editor User'}
      userEmail={staff?.email || 'editor@thulobazaar.com'}
      navSections={getEditorNavSections(params.lang)}
      theme="editor"
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Analytics</h1>
            <p className="text-gray-600 mt-1">Your personal moderation performance and statistics</p>
          </div>
          <div className="flex gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
            <button
              onClick={() => router.push(`/${params.lang}/editor/dashboard`)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <OverviewStats overview={analytics.overview} />

        {/* Daily Activity Trend */}
        {analytics.dailyStats.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Daily Activity Trend</h3>
            <p className="text-sm text-gray-600 mb-6">
              Your approved vs rejected ads over time
            </p>
            <LineChart data={analytics.dailyStats} />
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          {analytics.categoryBreakdown.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Category Distribution</h3>
              <p className="text-sm text-gray-600 mb-6">Ads you reviewed by category</p>
              <PieChart
                data={analytics.categoryBreakdown.map((cat, index) => ({
                  category: cat.category,
                  percentage: cat.percentage,
                  color: pieChartColors[index % pieChartColors.length] || 'bg-gray-500',
                }))}
              />
            </div>
          )}

          {/* Rejection Reasons */}
          {analytics.rejectionReasons.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Top Rejection Reasons</h3>
              <p className="text-sm text-gray-600 mb-6">Most common reasons you rejected ads</p>
              <BarChart
                data={analytics.rejectionReasons.map((reason) => ({
                  label: reason.reason,
                  value: reason.count,
                  color: 'bg-red-500',
                }))}
              />
            </div>
          )}
        </div>

        {/* Hourly Activity Heatmap */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Hourly Activity Heatmap</h3>
          <p className="text-sm text-gray-600 mb-6">
            Your moderation activity by hour of day (0-23)
          </p>
          <Heatmap data={analytics.hourlyActivity} />
          <div className="flex items-center justify-center gap-2 mt-6">
            <span className="text-sm text-gray-600">Low</span>
            <div className="flex gap-1">
              <div className="w-6 h-6 bg-teal-100 rounded" />
              <div className="w-6 h-6 bg-teal-300 rounded" />
              <div className="w-6 h-6 bg-teal-500 rounded" />
              <div className="w-6 h-6 bg-teal-700 rounded" />
            </div>
            <span className="text-sm text-gray-600">High</span>
          </div>
        </div>

        {/* Insights & Recommendations */}
        <InsightsSection
          avgResponseTime={analytics.overview.avgResponseTime}
          approvalRate={analytics.overview.approvalRate}
        />
      </div>
    </DashboardLayout>
  );
}

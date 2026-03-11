'use client';

import { StatsCard } from '@/components/admin';
import type { DashboardStats } from '../types';

interface StatsGridProps {
  stats: DashboardStats | null;
  avgResponseTimeTrendText: string;
}

// For pending metrics: decrease = good (green), increase = bad (red)
function parsePendingTrend(changeStr: string | undefined): { isPositive: boolean; label: string } {
  if (!changeStr || changeStr === '0%') return { isPositive: true, label: 'no change vs last week' };
  const num = parseFloat(changeStr);
  if (num > 0) return { isPositive: false, label: 'increase vs last week' };
  return { isPositive: true, label: 'decrease vs last week' };
}

export default function StatsGrid({ stats, avgResponseTimeTrendText }: StatsGridProps) {
  const pendingAdsTrend = parsePendingTrend(stats?.pendingChange);
  const verificationsTrend = parsePendingTrend(stats?.verificationsChange);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatsCard
        title="Pending Ads"
        value={stats?.pendingAds || 0}
        icon="📢"
        color="primary"
        theme="editor"
        trend={{
          value: stats?.pendingChange || '0%',
          isPositive: pendingAdsTrend.isPositive,
          label: pendingAdsTrend.label,
        }}
      />
      <StatsCard
        title="Pending Verifications"
        value={stats?.pendingVerifications || 0}
        icon="✅"
        color="success"
        theme="editor"
        trend={{
          value: stats?.verificationsChange || '0%',
          isPositive: verificationsTrend.isPositive,
          label: verificationsTrend.label,
        }}
      />
      <StatsCard
        title="Avg. Response Time"
        value={stats?.avgResponseTime || '0h'}
        icon="⏱️"
        color="success"
        theme="editor"
        trend={{
          value: avgResponseTimeTrendText,
          isPositive: avgResponseTimeTrendText.includes('Improved') || avgResponseTimeTrendText === 'Stable',
          label: '',
        }}
      />
    </div>
  );
}

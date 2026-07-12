'use client';

import type { TicketStats } from './types';

interface StatsCardsProps {
  stats: TicketStats;
}

interface StatCardProps {
  label: string;
  value: number;
  emoji: string;
  className: string;
  labelClass: string;
  valueClass: string;
}

function StatCard({ label, value, emoji, className, labelClass, valueClass }: StatCardProps) {
  return (
    <div className={`border-2 rounded-xl p-3 sm:p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className={`text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 ${labelClass}`}>{label}</div>
          <div className={`text-2xl sm:text-3xl font-bold ${valueClass}`}>{value}</div>
        </div>
        <div className="text-2xl sm:text-4xl">{emoji}</div>
      </div>
    </div>
  );
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      <StatCard
        label="Open" value={stats.open} emoji="📬"
        className="bg-gradient-to-br from-green-50 to-green-100 border-green-200"
        labelClass="text-green-700" valueClass="text-green-900"
      />
      <StatCard
        label="In Progress" value={stats.inProgress} emoji="⏳"
        className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200"
        labelClass="text-yellow-700" valueClass="text-yellow-900"
      />
      <StatCard
        label="Urgent" value={stats.urgent} emoji="🚨"
        className="bg-gradient-to-br from-red-50 to-red-100 border-red-200"
        labelClass="text-red-700" valueClass="text-red-900"
      />
      <StatCard
        label="Resolved" value={stats.resolved} emoji="✅"
        className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
        labelClass="text-blue-700" valueClass="text-blue-900"
      />
    </div>
  );
}

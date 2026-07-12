'use client';

import type { AnalyticsData } from '../types';

interface InsightsSectionProps {
  avgResponseTime: number;
  approvalRate: number;
  hourlyActivity: AnalyticsData['hourlyActivity'];
}

function formatTime(hours: number): string {
  if (hours <= 0) return 'N/A';
  if (hours < 1) return `${Math.round(hours * 60)} minutes`;
  if (hours < 24) return `${hours.toFixed(1)} hours`;
  return `${(hours / 24).toFixed(1)} days`;
}

function formatHour(h: number): string {
  const period = h < 12 ? 'AM' : 'PM';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr} ${period}`;
}

/**
 * Compute the busiest contiguous 3-hour window from the editor's REAL hourly
 * moderation counts. Returns null when there's no activity yet.
 */
function peakWindow(hourly: AnalyticsData['hourlyActivity']): { start: number; end: number } | null {
  const counts = new Array(24).fill(0);
  let total = 0;
  for (const { hour, count } of hourly) {
    if (hour >= 0 && hour < 24) counts[hour] = count;
    total += count;
  }
  if (total === 0) return null;

  let bestStart = 0;
  let bestSum = -1;
  for (let start = 0; start <= 21; start++) {
    const sum = counts[start] + counts[start + 1] + counts[start + 2];
    if (sum > bestSum) {
      bestSum = sum;
      bestStart = start;
    }
  }
  return { start: bestStart, end: bestStart + 3 };
}

export default function InsightsSection({ avgResponseTime, approvalRate, hourlyActivity }: InsightsSectionProps) {
  const formattedTime = formatTime(avgResponseTime);
  const peak = peakWindow(hourlyActivity);

  const peakText = peak
    ? `You're most active between ${formatHour(peak.start)} and ${formatHour(peak.end)}. Scheduling reviews around this window keeps queues short.`
    : 'Not enough activity in this period yet to detect your peak hours.';

  const approvalText =
    approvalRate >= 98
      ? `Your approval rate of ${approvalRate}% is very high — just make sure genuinely problematic ads aren't slipping through.`
      : approvalRate >= 80
        ? `Your approval rate of ${approvalRate}% is healthy. Consistent rates indicate you're applying the guidelines clearly.`
        : `Your approval rate is ${approvalRate}%. A lower rate can be fine, but it's worth checking your top rejection reasons for patterns.`;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 rounded-xl p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
        <span>💡</span> Insights & Recommendations
      </h3>
      <div className="space-y-3">
        <div className="bg-white rounded-lg p-4 border border-indigo-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📈</span>
            <div>
              <div className="font-semibold text-gray-900 mb-1">Your Peak Activity Hours</div>
              <div className="text-sm text-gray-600">{peakText}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-indigo-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <div className="font-semibold text-gray-900 mb-1">Response Time</div>
              <div className="text-sm text-gray-600">
                Your current average response time is {formattedTime}. Aim to keep it under 2 hours
                for better user satisfaction.
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-indigo-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <div className="font-semibold text-gray-900 mb-1">Approval Rate</div>
              <div className="text-sm text-gray-600">{approvalText}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

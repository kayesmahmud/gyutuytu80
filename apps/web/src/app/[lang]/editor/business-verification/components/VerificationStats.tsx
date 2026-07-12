'use client';

import type { BusinessVerification, TabStatus } from './types';

interface VerificationStatsProps {
  activeTab: TabStatus;
  verifications: BusinessVerification[];
}

export function VerificationStats({ activeTab, verifications }: VerificationStatsProps) {
  const tabStyles = {
    pending: { bg: 'from-blue-50 to-blue-100 border-blue-200', text: 'text-blue-', icon: '🏢' },
    rejected: { bg: 'from-red-50 to-red-100 border-red-200', text: 'text-red-', icon: '❌' },
    approved: { bg: 'from-green-50 to-green-100 border-green-200', text: 'text-green-', icon: '✅' },
  };

  const tabLabels = {
    pending: 'Total Pending',
    rejected: 'Total Rejected',
    approved: 'Total Verified',
  };

  const style = tabStyles[activeTab];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
      <div className={`bg-gradient-to-br ${style.bg} border-2 rounded-xl p-3 sm:p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-xs sm:text-sm font-medium mb-1 ${style.text}700`}>
              {tabLabels[activeTab]}
            </div>
            <div className={`text-2xl sm:text-3xl font-bold ${style.text}900`}>
              {verifications.length}
            </div>
          </div>
          <div className="text-2xl sm:text-4xl">{style.icon}</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-3 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs sm:text-sm font-medium text-purple-700 mb-1">With Documents</div>
            <div className="text-2xl sm:text-3xl font-bold text-purple-900">
              {verifications.filter((v) => v.businessLicense).length}
            </div>
          </div>
          <div className="text-2xl sm:text-4xl">📄</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-xl p-3 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs sm:text-sm font-medium text-amber-700 mb-1">
              {activeTab === 'rejected' ? 'Recent Rejections' : 'Processing Time'}
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-900">
              {activeTab === 'rejected' ? verifications.length : '1-2d'}
            </div>
          </div>
          <div className="text-2xl sm:text-4xl">{activeTab === 'rejected' ? '📋' : '⏱️'}</div>
        </div>
      </div>
    </div>
  );
}

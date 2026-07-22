'use client';

import type { AccountState, SuspendedUser } from '../types';
import { formatDate, getAccountState } from '../types';

const STATE_BADGES: Record<AccountState, { label: string; className: string }> = {
  suspended: { label: '🚫 Suspended', className: 'bg-red-100 text-red-700' },
  'deletion-pending': { label: '🗑️ Deletion Pending', className: 'bg-amber-100 text-amber-700' },
  deactivated: { label: '💤 Deactivated', className: 'bg-gray-100 text-gray-700' },
  rejected: { label: '❌ Rejected', className: 'bg-orange-100 text-orange-700' },
};

interface SuspendedTableProps {
  users: SuspendedUser[];
}

export default function SuspendedTable({ users }: SuspendedTableProps) {
  return (
    <>
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-rose-50 to-red-50">
        <h2 className="text-lg font-bold text-gray-900">Inactive & Rejected Accounts</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Ads</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  No inactive or rejected accounts
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {(() => {
                      const badge = STATE_BADGES[getAccountState(u)];
                      return (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${badge.className}`}>
                          {badge.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{u.fullName || 'N/A'}</div>
                    {u.shopSlug && (
                      <div className="text-xs text-gray-500">Shop: {u.shopSlug}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{u.email}</div>
                    {u.phone && <div className="text-sm text-gray-500">{u.phone}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">{u.adCount}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(u.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

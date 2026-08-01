'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

interface OwnerEditButtonProps {
  adId: number;
  sellerId: number;
  adTitle: string;
  editCount: number;
}

interface EditHistoryRow {
  id: number;
  resulting_status: string;
  previous_data: Record<string, unknown>;
  created_at: string;
}

/**
 * "Edit this ad" button + edit-history link in the ad header.
 * Owner → edit form + own history modal. Editors/admins → the editor panel,
 * pre-searched for this ad (the user edit endpoint is ownership-locked).
 * Everyone else sees nothing.
 */
export default function OwnerEditButton({ adId, sellerId, adTitle, editCount }: OwnerEditButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || 'en';
  const t = useTranslations('ads');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<EditHistoryRow[] | null>(null);

  const parsedId = session?.user?.id ? Number(session.user.id) : NaN;
  const sessionUserId = Number.isFinite(parsedId) ? parsedId : null;
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isStaff = role === 'editor' || role === 'super_admin' || role === 'admin';
  const isOwner = sessionUserId !== null && sessionUserId === sellerId;

  useEffect(() => {
    if (showHistory && isOwner && history === null) {
      apiClient
        .getMyAdEditHistory(adId)
        .then((res) => setHistory(res.success && res.data ? res.data : []))
        .catch(() => setHistory([]));
    }
  }, [showHistory, isOwner, history, adId]);

  if (status === 'loading') return null;
  if (!isOwner && !isStaff) return null;

  const href = isOwner
    ? `/${lang}/edit-ad/${adId}`
    : `/${lang}/editor/ad-management?status=all&search=${encodeURIComponent(adTitle)}`;

  return (
    <div className="flex flex-col items-end gap-1 flex-shrink-0">
      <button
        onClick={() => router.push(href)}
        className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 hover:border-indigo-300 transition-colors whitespace-nowrap"
      >
        ✏️ {t('editThisAd')}
      </button>

      {isOwner && editCount > 0 && (
        <button
          onClick={() => setShowHistory(true)}
          className="text-xs text-gray-500 hover:text-indigo-600 underline underline-offset-2 whitespace-nowrap"
        >
          {t('edited')} ×{editCount} — {t('viewEditHistory')}
        </button>
      )}

      {showHistory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowHistory(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">{t('editHistory')}</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {history === null ? (
              <p className="text-sm text-gray-500">…</p>
            ) : history.length === 0 ? (
              <p className="text-sm text-gray-500">{t('noEditsYet')}</p>
            ) : (
              <ol className="space-y-4">
                {history.map((row) => (
                  <li key={row.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {new Date(row.created_at).toLocaleString()}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          row.resulting_status === 'approved'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {row.resulting_status === 'approved' ? t('wentLiveDirectly') : t('sentToReview')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>
                        <span className="text-gray-400">{t('previousTitle')}:</span>{' '}
                        {String(row.previous_data?.title ?? '—')}
                      </div>
                      {row.previous_data?.price != null && (
                        <div>
                          <span className="text-gray-400">{t('previousPrice')}:</span>{' '}
                          Rs. {Number(row.previous_data.price).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

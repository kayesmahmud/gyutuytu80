'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  XCircle,
  PauseCircle,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Eye,
  History,
  FileClock,
  MessageCircle,
} from 'lucide-react';
import { getStatusBadge, getAvailableActions } from '@/utils/editorUtils';
import { getImageUrl } from '@/lib/images/imageUrl';
import { getSellerBadge } from '../sellerBadge';
import type { Ad } from '../types';

interface AdCardProps {
  ad: Ad;
  lang: string;
  actions: {
    loading: boolean;
    handleApprove: (id: number) => Promise<void>;
    handleDelete: (id: number) => Promise<void>;
    handleUnsuspend: (id: number) => Promise<void>;
    handleRestore: (id: number) => Promise<void>;
  };
  onReject: (ad: Ad) => void;
  onSuspend: (ad: Ad) => void;
  onPermanentDelete: (ad: Ad) => void;
  onHistory: (ad: Ad) => void;
  onEditHistory: (ad: Ad) => void;
}

export default function AdCard({
  ad,
  lang,
  actions,
  onReject,
  onSuspend,
  onPermanentDelete,
  onHistory,
  onEditHistory,
}: AdCardProps) {
  const availableActions = getAvailableActions(ad);
  const sellerBadge = getSellerBadge(ad.seller);
  const router = useRouter();
  const [messageLoading, setMessageLoading] = useState(false);

  // Open (or create) the editor↔seller chat linked to THIS ad, then jump to it.
  // Auth rides on the editor's NextAuth session cookie — same-origin fetch.
  const handleMessageSeller = async () => {
    if (!ad.seller?.id) return;
    setMessageLoading(true);
    try {
      const res = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantIds: [ad.seller.id],
          type: 'direct',
          adId: ad.id,
        }),
      });
      const data = await res.json();
      if (data?.success && data.data?.id) {
        router.push(`/${lang}/messages?conversation=${data.data.id}`);
      } else {
        alert(data?.message || 'Could not open the conversation. Please try again.');
      }
    } catch {
      alert('Could not open the conversation. Please try again.');
    } finally {
      setMessageLoading(false);
    }
  };

  // Editors see two timestamps: when the user POSTED (created_at, even while
  // pending) and when an editor REVIEWED it (reviewed_at). The public site
  // shows only the approval time.
  const DATE_TIME_OPTS: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  const postedAt = new Date(ad.createdAt).toLocaleString('en-US', DATE_TIME_OPTS);
  const reviewedAt = ad.reviewedAt
    ? new Date(ad.reviewedAt).toLocaleString('en-US', DATE_TIME_OPTS)
    : null;
  // reviewed_at is set on approve/reject/suspend — label it by what happened.
  const reviewLabel =
    ad.status === 'approved' ? 'Approved'
    : ad.status === 'rejected' ? 'Rejected'
    : ad.status === 'suspended' ? 'Suspended'
    : 'Reviewed';

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border transition-shadow ${
        ad.deletedAt ? 'border-gray-400 opacity-75' : 'border-gray-200 hover:shadow-md'
      }`}
    >
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          {/* Ad Image */}
          <div className="flex-shrink-0">
            {ad.images && ad.images.length > 0 ? (
              <Image
                src={getImageUrl(ad.images[0], 'ads') || ''}
                alt={ad.title}
                width={192}
                height={144}
                unoptimized
                className="object-cover rounded-lg w-full h-48 sm:w-48 sm:h-36"
              />
            ) : (
              <div className="w-full h-48 sm:w-48 sm:h-36 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-4xl">📷</span>
              </div>
            )}
          </div>

          {/* Ad Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-2 sm:gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-xl font-bold text-gray-900">{ad.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(ad.status)}`}>
                    {ad.status.toUpperCase()}
                  </span>
                  {ad.reviewedByName && (
                    <span className="text-xs text-gray-500">
                      By: <span className="font-medium text-gray-700">{ad.reviewedByName}</span>
                    </span>
                  )}
                  {ad.deletedAt && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-gray-100 text-gray-800 border-gray-200">
                      DELETED
                    </span>
                  )}
                  {ad.deletedAt && ad.deletedByName && (
                    <span className="text-xs text-gray-500">
                      By: <span className="font-medium text-gray-700">{ad.deletedByName}</span>
                    </span>
                  )}
                </div>
                <p className="text-gray-600 line-clamp-2 mb-2">{ad.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1">🏷️ {ad.category}</span>
                  <span className="flex items-center gap-1">📍 {ad.location}</span>
                  <span className="flex items-center gap-1">💰 NPR {ad.price?.toLocaleString()}</span>
                  {ad.condition && <span className="flex items-center gap-1">📦 {ad.condition}</span>}
                </div>
              </div>
              <div className="text-left sm:text-right text-sm text-gray-500 flex-shrink-0">
                <div>ID: #{ad.id}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wide text-gray-400">Posted</div>
                <div className="font-medium text-gray-600">{postedAt}</div>
                {reviewedAt && (
                  <>
                    <div className="mt-1 text-[11px] uppercase tracking-wide text-gray-400">{reviewLabel}</div>
                    <div className="font-medium text-gray-600">{reviewedAt}</div>
                  </>
                )}
              </div>
            </div>

            {/* Posted by (seller) — who created this ad + their verification status */}
            {(ad.seller || ad.sellerName) && (
              <div className="mb-3 flex items-center gap-2 flex-wrap text-sm">
                <span className="text-gray-500">Posted by</span>
                <span className="font-semibold text-gray-900">
                  {ad.seller?.name || ad.sellerName}
                </span>
                {sellerBadge.badgeImage && (
                  <Image
                    src={sellerBadge.badgeImage}
                    alt={sellerBadge.label}
                    width={16}
                    height={16}
                    className="inline-block"
                  />
                )}
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sellerBadge.className}`}>
                  {sellerBadge.label}
                </span>
                {ad.seller?.email && (
                  <span className="text-gray-400">· {ad.seller.email}</span>
                )}
              </div>
            )}

            {/* Status Messages */}
            {ad.status === 'rejected' && ad.statusReason && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                <span className="font-medium">Rejection Reason:</span> {ad.statusReason}
              </div>
            )}

            {ad.status === 'suspended' && ad.statusReason && (
              <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
                <span className="font-medium">Suspension Reason:</span> {ad.statusReason}
                {ad.suspendedUntil && (
                  <div className="mt-1">
                    <span className="font-medium">Suspended Until:</span>{' '}
                    {new Date(ad.suspendedUntil).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}

            {ad.deletedAt && (
              <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800">
                <span className="font-medium">Deleted At:</span>{' '}
                {new Date(ad.deletedAt).toLocaleDateString()}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4 flex-wrap">
              <button
                onClick={() => window.open(`/${lang}/ad/${ad.slug}`, '_blank')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <Eye size={16} />
                View Details
              </button>

              <button
                onClick={() => onHistory(ad)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <History size={16} />
                History
              </button>

              <button
                onClick={() => onEditHistory(ad)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <FileClock size={16} />
                Edit History
              </button>

              {ad.seller?.id && (
                <button
                  onClick={handleMessageSeller}
                  disabled={messageLoading}
                  className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <MessageCircle size={16} />
                  {messageLoading ? 'Opening…' : 'Message'}
                </button>
              )}

              {availableActions.includes('approve') && (
                <button
                  onClick={() => actions.handleApprove(ad.id)}
                  disabled={actions.loading}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckCircle size={16} />
                  Approve
                </button>
              )}

              {availableActions.includes('reject') && (
                <button
                  onClick={() => onReject(ad)}
                  disabled={actions.loading}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <XCircle size={16} />
                  Reject
                </button>
              )}

              {availableActions.includes('suspend') && (
                <button
                  onClick={() => onSuspend(ad)}
                  disabled={actions.loading}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <PauseCircle size={16} />
                  Suspend
                </button>
              )}

              {availableActions.includes('unsuspend') && (
                <button
                  onClick={() => actions.handleUnsuspend(ad.id)}
                  disabled={actions.loading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <RotateCcw size={16} />
                  Unsuspend
                </button>
              )}

              {availableActions.includes('restore') && (
                <button
                  onClick={() => actions.handleRestore(ad.id)}
                  disabled={actions.loading}
                  className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <RotateCcw size={16} />
                  Restore
                </button>
              )}

              {availableActions.includes('delete') && (
                <button
                  onClick={() => actions.handleDelete(ad.id)}
                  disabled={actions.loading}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              )}

              {availableActions.includes('permanentDelete') && (
                <button
                  onClick={() => onPermanentDelete(ad)}
                  disabled={actions.loading}
                  className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-950 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <AlertTriangle size={16} />
                  Delete Forever
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { getRecentOwnerEdits, type RecentOwnerEdit } from '@/lib/editorApi';
import { EditorModal } from './EditorModal';

interface RecentOwnerEditsModalProps {
  lang: string;
  onClose: () => void;
}

type EditsFilter = 'all' | 'approved';

const PAGE_LIMIT = 20;

// resulting_status → chip (pending = sent back to review, approved = went live directly)
const STATUS_CHIPS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Sent to review', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  approved: { label: 'Went live directly', className: 'bg-green-100 text-green-800 border-green-200' },
};

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function RecentOwnerEditsModal({ lang, onClose }: RecentOwnerEditsModalProps) {
  const [edits, setEdits] = useState<RecentOwnerEdit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<EditsFilter>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const response = await getRecentOwnerEdits({
          page,
          limit: PAGE_LIMIT,
          resulting_status: filter === 'approved' ? 'approved' : undefined,
        });
        if (active && response.success && Array.isArray(response.data)) {
          setEdits(response.data);
          setTotalPages(response.pagination?.totalPages || 1);
        }
      } catch (error) {
        console.error('Failed to load recent owner edits:', error);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [page, filter]);

  const handleFilterChange = (newFilter: EditsFilter) => {
    setFilter(newFilter);
    setPage(1);
  };

  return (
    <EditorModal isOpen onClose={onClose} title="Recent Owner Edits" maxWidth="2xl">
      {/* Filter toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => handleFilterChange('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => handleFilterChange('approved')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === 'approved' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Went live
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading owner edits...</div>
      ) : edits.length === 0 ? (
        <div className="py-8 text-center text-gray-500">No owner edits yet.</div>
      ) : (
        <ol className="space-y-3">
          {edits.map((edit) => {
            const chip = STATUS_CHIPS[edit.resulting_status] || {
              label: edit.resulting_status,
              className: 'bg-gray-100 text-gray-800 border-gray-200',
            };
            return (
              <li key={edit.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {edit.ads?.slug ? (
                    <a
                      href={`/${lang}/ad/${edit.ads.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                    >
                      {edit.ads.title || `Ad #${edit.ad_id}`}
                    </a>
                  ) : (
                    <span className="text-sm font-semibold text-gray-900">
                      {edit.ads?.title || `Ad #${edit.ad_id}`}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${chip.className}`}>
                    {chip.label}
                  </span>
                </div>
                <div className="mt-1 text-sm text-gray-500 flex items-center gap-2 flex-wrap">
                  <span>
                    Edited by{' '}
                    <span className="font-medium text-gray-700">
                      {edit.users?.full_name || 'Unknown'}
                    </span>
                    {edit.users?.business_name && (
                      <span className="text-gray-400"> ({edit.users.business_name})</span>
                    )}
                  </span>
                  <span className="text-gray-400">{formatDate(edit.created_at)}</span>
                  {edit.users?.direct_edit_revoked && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-red-100 text-red-800 border-red-200">
                      Direct publish revoked
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1 || loading}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages || loading}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </EditorModal>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { getAdHistory, type AdHistoryEntry } from '@/lib/editorApi';
import { EditorModal } from './EditorModal';

interface AdHistoryModalProps {
  adId: number;
  adTitle: string;
  onClose: () => void;
}

// How each action reads in the timeline (verb + dot colour)
const ACTION_STYLES: Record<string, { label: string; dot: string }> = {
  approved: { label: 'Approved', dot: 'bg-green-500' },
  rejected: { label: 'Rejected', dot: 'bg-red-500' },
  suspended: { label: 'Suspended', dot: 'bg-orange-500' },
  unsuspended: { label: 'Unsuspended', dot: 'bg-blue-500' },
  deleted: { label: 'Deleted', dot: 'bg-gray-600' },
  restored: { label: 'Restored', dot: 'bg-teal-500' },
  permanently_deleted: { label: 'Permanently Deleted', dot: 'bg-red-900' },
  owner_edit_live: { label: 'Owner Edited Live Ad', dot: 'bg-purple-500' },
  owner_edit_resubmit: { label: 'Owner Edited (Sent to Review)', dot: 'bg-yellow-500' },
  owner_direct_publish: { label: 'Owner Edit Published Directly', dot: 'bg-emerald-500' },
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

export function AdHistoryModal({ adId, adTitle, onClose }: AdHistoryModalProps) {
  const [history, setHistory] = useState<AdHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const response = await getAdHistory(adId);
        if (active && response.success && response.data) {
          setHistory(response.data);
        }
      } catch (error) {
        console.error('Failed to load ad history:', error);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [adId]);

  return (
    <EditorModal isOpen onClose={onClose} title="Moderation History" maxWidth="lg">
      <p className="text-gray-600 mb-4 -mt-2">
        History for: <strong>{adTitle}</strong>
      </p>

      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading history...</div>
      ) : history.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          No moderation actions recorded yet for this ad.
        </div>
      ) : (
        <ol className="space-y-4">
          {history.map((entry) => {
            const style = ACTION_STYLES[entry.action] || {
              label: entry.action,
              dot: 'bg-gray-400',
            };
            return (
              <li key={entry.id} className="flex gap-3">
                <span className={`mt-1.5 h-3 w-3 flex-shrink-0 rounded-full ${style.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{style.label}</span>
                    <span className="text-sm text-gray-500">
                      by{' '}
                      <span className="font-medium text-gray-700">
                        {entry.actorName || 'Unknown'}
                      </span>{' '}
                      <span className="text-gray-400">({entry.actorType})</span>
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">{formatDate(entry.createdAt)}</div>
                  {entry.reason && (
                    <p className="mt-1 text-sm text-gray-700">
                      <span className="font-medium">Reason:</span> {entry.reason}
                    </p>
                  )}
                  {entry.notes && (
                    <p className="mt-0.5 text-sm text-gray-500">{entry.notes}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </EditorModal>
  );
}

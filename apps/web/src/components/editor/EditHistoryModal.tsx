'use client';

import { useEffect, useState } from 'react';
import { getAdEditHistory, type AdEditHistoryEntry } from '@/lib/editorApi';
import { EditorModal } from './EditorModal';

interface EditHistoryModalProps {
  adId: number;
  adTitle: string;
  onClose: () => void;
}

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

function VersionEntry({ entry }: { entry: AdEditHistoryEntry }) {
  const [expanded, setExpanded] = useState(false);

  const chip = STATUS_CHIPS[entry.resulting_status] || {
    label: entry.resulting_status,
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  const snapshot = entry.previous_data;
  const ownerName = entry.users?.full_name || 'Unknown';
  const businessName = entry.users?.business_name;
  const description = snapshot?.description || '';
  const imageCount = snapshot?.images?.length || 0;

  return (
    <li className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className="text-sm font-semibold text-gray-900">{ownerName}</span>
        {businessName && <span className="text-xs text-gray-500">({businessName})</span>}
        <span className="text-xs text-gray-400">{formatDate(entry.created_at)}</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${chip.className}`}>
          {chip.label}
        </span>
      </div>

      {snapshot ? (
        <div className="text-sm text-gray-700 space-y-1">
          <p className="text-xs uppercase tracking-wide text-gray-400">Before this edit</p>
          <p>
            <span className="font-medium">Title:</span> {snapshot.title}
          </p>
          <p>
            <span className="font-medium">Price:</span>{' '}
            NPR {Number(snapshot.price || 0).toLocaleString()}
          </p>
          <p>
            <span className="font-medium">Images:</span> {imageCount}
          </p>
          {description && (
            <div>
              <span className="font-medium">Description:</span>{' '}
              <span className={expanded ? '' : 'line-clamp-2'}>{description}</span>
              {description.length > 120 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="ml-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                >
                  {expanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No snapshot recorded for this edit.</p>
      )}
    </li>
  );
}

export function EditHistoryModal({ adId, adTitle, onClose }: EditHistoryModalProps) {
  const [history, setHistory] = useState<AdEditHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const response = await getAdEditHistory(adId);
        if (active && response.success && response.data) {
          setHistory(response.data);
        }
      } catch (error) {
        console.error('Failed to load edit history:', error);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [adId]);

  return (
    <EditorModal isOpen onClose={onClose} title="Owner Edit History" maxWidth="xl">
      <p className="text-gray-600 mb-4 -mt-2">
        Versions of: <strong>{adTitle}</strong>
      </p>

      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading edit history...</div>
      ) : history.length === 0 ? (
        <div className="py-8 text-center text-gray-500">No owner edits yet.</div>
      ) : (
        <ol className="space-y-3">
          {history.map((entry) => (
            <VersionEntry key={entry.id} entry={entry} />
          ))}
        </ol>
      )}
    </EditorModal>
  );
}

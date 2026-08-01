'use client';

import { useState } from 'react';
import { ShieldOff } from 'lucide-react';

interface RevokeDirectEditModalProps {
  userName: string;
  onConfirm: (reason: string) => Promise<void>;
  onCancel: () => void;
}

export function RevokeDirectEditModal({ userName, onConfirm, onCancel }: RevokeDirectEditModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) return;

    try {
      setLoading(true);
      await onConfirm(reason);
      setReason('');
    } catch (error) {
      console.error('Revoke failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <ShieldOff className="text-red-500" size={24} />
          <h3 className="text-xl font-bold text-gray-900">Revoke Direct Publish</h3>
        </div>

        <p className="text-gray-600 mb-4">
          You are about to revoke direct publish for: <strong>{userName}</strong>
        </p>

        <label className="block text-sm font-medium text-gray-700 mb-2">
          Revoke Reason *
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why is direct publish being revoked for this business?"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none mb-4"
          rows={4}
        />

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-yellow-800">
            💡 <strong>Note:</strong> Their edits and new ads will go back through
            editor review until direct publish is restored.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !reason.trim()}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Revoking...' : 'Confirm Revoke'}
          </button>
        </div>
      </div>
    </div>
  );
}

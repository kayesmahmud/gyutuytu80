'use client';

import { useState } from 'react';

interface ReportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: number;
  userName: string;
  conversationId?: number;
}

// Must match VALID_USER_REPORT_REASONS in the API
const REPORT_REASONS = [
  { value: 'spam', label: 'Spam', icon: '📧' },
  { value: 'scam', label: 'Scam or fraud', icon: '⚠️' },
  { value: 'harassment', label: 'Harassment', icon: '🚫' },
  { value: 'inappropriate', label: 'Inappropriate content', icon: '🙈' },
  { value: 'impersonation', label: 'Impersonation', icon: '🎭' },
  { value: 'other', label: 'Other', icon: '📝' },
] as const;

export default function ReportUserModal({
  isOpen,
  onClose,
  reportedUserId,
  userName,
  conversationId,
}: ReportUserModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError('Please select a reason');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/reports/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reportedUserId,
          reason: selectedReason,
          details: details.trim() || undefined,
          conversationId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSelectedReason('');
          setDetails('');
          setSuccess(false);
        }, 2000);
      } else {
        setError(data.message || 'Failed to submit report');
      }
    } catch {
      setError('Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setSelectedReason('');
    setDetails('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-rose-500 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-xl">🚩</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Report user</h2>
                <p className="text-sm text-white/80 line-clamp-1">{userName}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Report submitted</h3>
              <p className="text-gray-600">Our team will review it shortly.</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Reason Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why are you reporting this user? <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {REPORT_REASONS.map((reason) => (
                    <button
                      key={reason.value}
                      type="button"
                      onClick={() => setSelectedReason(reason.value)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                        selectedReason === reason.value
                          ? 'border-rose-500 bg-rose-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-xl">{reason.icon}</span>
                      <span
                        className={`font-medium text-left flex-1 ${
                          selectedReason === reason.value ? 'text-rose-700' : 'text-gray-900'
                        }`}
                      >
                        {reason.label}
                      </span>
                      {selectedReason === reason.value && (
                        <svg className="w-5 h-5 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Details */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional details (optional)
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Tell us more about the issue..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                />
                <div className="text-xs text-gray-400 text-right mt-1">{details.length}/500</div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedReason}
                className="w-full py-3 bg-rose-500 hover:bg-rose-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit report'}
              </button>

              <p className="mt-4 text-xs text-gray-500 text-center">
                False reports may result in action against your account.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

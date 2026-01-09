'use client';

import { useAccountDeletion } from '@/hooks/useAccountDeletion';
import { signOut } from 'next-auth/react';
import { OtpInput } from './OtpInput';

export function DangerZone() {
  const accountDeletion = useAccountDeletion(() => {
    setTimeout(() => signOut({ callbackUrl: '/' }), 3000);
  });

  const { step, error, otp, cooldown, maskedPhone, recoveryDeadline, isProcessing } = accountDeletion;

  const formatDeadline = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (step === 'success') {
    return (
      <div className="border-t border-red-200 pt-6 mt-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Scheduled for Deletion</h3>
          <p className="text-sm text-gray-600 mb-4">
            Your account will be permanently deleted on <strong>{formatDeadline(recoveryDeadline)}</strong>.
          </p>
          <p className="text-sm text-gray-500">
            If you change your mind, simply log in again before this date to reactivate your account.
          </p>
          <p className="text-xs text-gray-400 mt-4">You will be signed out in a few seconds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-red-200 pt-6 mt-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-red-600 mb-1 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Danger Zone
        </h3>
        <p className="text-sm text-gray-500">Irreversible and destructive actions</p>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        {step === 'idle' && (
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">Delete Account</h4>
              <p className="text-xs text-gray-600">
                Once you delete your account, all your data will be hidden from other users.
                You have 30 days to recover your account by logging in again. After 30 days,
                your account and all data will be permanently deleted.
              </p>
            </div>
            <button
              onClick={accountDeletion.startDeletion}
              className="flex-shrink-0 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Account
            </button>
          </div>
        )}

        {step === 'confirm_intent' && (
          <div className="space-y-4">
            <div className="bg-white border border-red-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Are you sure you want to delete your account?
              </h4>
              <p className="text-xs text-gray-600 mb-3">This will:</p>
              <ul className="text-xs text-gray-600 space-y-1 mb-4">
                <li>• Hide your profile from other users immediately</li>
                <li>• Deactivate all your active ads</li>
                <li>• Give you 30 days to recover by logging in again</li>
                <li>• Permanently delete all your data after 30 days</li>
              </ul>
              <p className="text-xs text-gray-500">
                We will send a verification code to your registered phone number.
              </p>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={accountDeletion.cancel}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={accountDeletion.confirmIntent}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  'Yes, Send Verification Code'
                )}
              </button>
            </div>
          </div>
        )}

        {(step === 'sending_otp' || step === 'enter_otp' || step === 'deleting') && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-700 mb-1">
                Enter the verification code sent to
              </p>
              <p className="text-sm font-medium text-gray-900">{maskedPhone}</p>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <OtpInput
              value={otp}
              onChange={accountDeletion.setOtp}
              status={error ? 'error' : 'idle'}
              disabled={step === 'deleting'}
              autoFocus
            />

            <button
              onClick={accountDeletion.verifyOtp}
              disabled={otp.length !== 6 || step === 'deleting'}
              className="w-full px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {step === 'deleting' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Deleting Account...
                </>
              ) : (
                'Confirm Account Deletion'
              )}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                onClick={accountDeletion.cancel}
                className="text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={accountDeletion.resendOtp}
                disabled={cooldown > 0 || isProcessing}
                className="text-red-600 hover:text-red-700 disabled:text-gray-400"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


'use client';

import { useState } from 'react';
import { useTwoFactor } from '@/hooks/useTwoFactor';
import { TwoFactorSetupModal } from '@/components/admin/EditSuperAdminModal/TwoFactorSetupModal';
import { BackupCodesModal } from '@/components/admin/EditSuperAdminModal/BackupCodesModal';

interface TwoFactorSectionProps {
  initialEnabled: boolean;
  /** Whether the account has a usable password — disabling 2FA requires it. */
  canManage: boolean;
}

export function TwoFactorSection({ initialEnabled, canManage }: TwoFactorSectionProps) {
  const tf = useTwoFactor(initialEnabled);

  const [showDisableForm, setShowDisableForm] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [success, setSuccess] = useState('');

  const handleVerifySetup = async () => {
    await tf.verifySetup();
    // verifySetup flips into the backup-codes modal on success
  };

  const handleCloseBackupCodes = () => {
    tf.closeBackupCodes();
    setSuccess('Two-factor authentication is now enabled.');
    setTimeout(() => setSuccess(''), 6000);
  };

  const handleDisableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await tf.disable(disablePassword, disableCode);
    if (ok) {
      setShowDisableForm(false);
      setDisablePassword('');
      setDisableCode('');
      setSuccess('Two-factor authentication has been disabled.');
      setTimeout(() => setSuccess(''), 6000);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Two-Factor Authentication</h3>
        <p className="text-sm text-gray-500">
          Add an extra layer of security by requiring a code from your authenticator app when you sign in.
        </p>
      </div>

      {!canManage ? (
        <div className="bg-gray-50 rounded-lg p-6 max-w-md">
          <p className="text-sm text-gray-600">
            Two-factor authentication is not available for social login accounts. Set a password first to enable it.
          </p>
        </div>
      ) : (
        <div className="max-w-md space-y-4">
          {/* Status row */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tf.isEnabled ? 'bg-green-100' : 'bg-gray-200'
                }`}
              >
                <svg
                  className={`w-5 h-5 ${tf.isEnabled ? 'text-green-600' : 'text-gray-500'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Authenticator app</p>
                <p className={`text-xs font-medium ${tf.isEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                  {tf.isEnabled ? 'Enabled' : 'Not enabled'}
                </p>
              </div>
            </div>

            {!tf.isEnabled ? (
              <button
                type="button"
                onClick={tf.beginSetup}
                disabled={tf.loading}
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tf.loading ? 'Loading…' : 'Enable'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowDisableForm((v) => !v);
                  tf.clearError();
                }}
                className="px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
              >
                Disable
              </button>
            )}
          </div>

          {/* Success message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Inline error (setup-button / disable failures) */}
          {tf.error && !tf.showSetup && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {tf.error}
            </div>
          )}

          {/* Disable form — backend requires password + a current code */}
          {tf.isEnabled && showDisableForm && (
            <form onSubmit={handleDisableSubmit} className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
              <p className="text-sm text-gray-700">
                Confirm your password and a current authenticator (or backup) code to turn off 2FA.
              </p>
              <input
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                required
                placeholder="Current password"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
              />
              <input
                type="text"
                inputMode="numeric"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 8))}
                required
                placeholder="6-digit code"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-center tracking-widest font-mono focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDisableForm(false);
                    setDisablePassword('');
                    setDisableCode('');
                    tf.clearError();
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={tf.loading || !disablePassword || disableCode.length < 6}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {tf.loading ? 'Disabling…' : 'Disable 2FA'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Setup modal (QR + verify) */}
      {tf.showSetup && (
        <TwoFactorSetupModal
          qrCode={tf.qrCode}
          secret={tf.secret}
          verificationCode={tf.verificationCode}
          onVerificationCodeChange={tf.setVerificationCode}
          onVerify={handleVerifySetup}
          onClose={tf.cancelSetup}
          loading={tf.loading}
          error={tf.error}
          onClearError={tf.clearError}
        />
      )}

      {/* Backup codes modal (shown once after enabling) */}
      {tf.showBackupCodes && (
        <BackupCodesModal
          backupCodes={tf.backupCodes}
          onCopy={tf.copyBackupCodes}
          onClose={handleCloseBackupCodes}
        />
      )}
    </div>
  );
}

'use client';

import { useState, useCallback } from 'react';

interface UseTwoFactorReturn {
  // Status
  isEnabled: boolean;
  loading: boolean;
  error: string;

  // Setup flow
  showSetup: boolean;
  qrCode: string;
  secret: string;
  verificationCode: string;
  setVerificationCode: (value: string) => void;

  // Backup codes (shown once, right after enabling)
  showBackupCodes: boolean;
  backupCodes: string[];

  // Actions
  beginSetup: () => Promise<void>;
  verifySetup: () => Promise<void>;
  cancelSetup: () => void;
  closeBackupCodes: () => void;
  copyBackupCodes: () => void;
  disable: (password: string, code: string) => Promise<boolean>;
  clearError: () => void;
}

export function useTwoFactor(initialEnabled: boolean): UseTwoFactorReturn {
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showSetup, setShowSetup] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const clearError = useCallback(() => setError(''), []);

  const beginSetup = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();

      if (data.success && data.data) {
        setQrCode(data.data.qrCode);
        setSecret(data.data.secret);
        setVerificationCode('');
        setShowSetup(true);
      } else {
        setError(data.message || 'Failed to start 2FA setup. Please try again.');
      }
    } catch (err) {
      console.error('2FA setup error:', err);
      setError('Failed to start 2FA setup. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const verifySetup = useCallback(async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter the 6-digit code from your authenticator app.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/verify-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: verificationCode }),
      });
      const data = await res.json();

      if (data.success && data.data) {
        setBackupCodes(data.data.backupCodes || []);
        setShowSetup(false);
        setShowBackupCodes(true);
        setIsEnabled(true);
        setVerificationCode('');
        setQrCode('');
        setSecret('');
      } else {
        setError(data.message || 'Invalid verification code. Please try again.');
      }
    } catch (err) {
      console.error('2FA verify-setup error:', err);
      setError('Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [verificationCode]);

  const cancelSetup = useCallback(() => {
    setShowSetup(false);
    setQrCode('');
    setSecret('');
    setVerificationCode('');
    setError('');
  }, []);

  const closeBackupCodes = useCallback(() => {
    setShowBackupCodes(false);
    setBackupCodes([]);
  }, []);

  const copyBackupCodes = useCallback(() => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
  }, [backupCodes]);

  const disable = useCallback(async (password: string, code: string): Promise<boolean> => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password, code }),
      });
      const data = await res.json();

      if (data.success) {
        setIsEnabled(false);
        return true;
      }
      setError(data.message || 'Failed to disable 2FA. Please try again.');
      return false;
    } catch (err) {
      console.error('2FA disable error:', err);
      setError('Failed to disable 2FA. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    isEnabled,
    loading,
    error,
    showSetup,
    qrCode,
    secret,
    verificationCode,
    setVerificationCode,
    showBackupCodes,
    backupCodes,
    beginSetup,
    verifySetup,
    cancelSetup,
    closeBackupCodes,
    copyBackupCodes,
    disable,
    clearError,
  };
}

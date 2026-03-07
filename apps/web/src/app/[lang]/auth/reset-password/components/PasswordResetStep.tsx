'use client';

import { useTranslations } from 'next-intl';
import { LoadingSpinner } from './LoadingSpinner';

interface PasswordResetStepProps {
  newPassword: string;
  confirmPassword: string;
  isLoading: boolean;
  onNewPasswordChange: (password: string) => void;
  onConfirmPasswordChange: (password: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function PasswordResetStep({
  newPassword,
  confirmPassword,
  isLoading,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
}: PasswordResetStepProps) {
  const t = useTranslations('auth');
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
          {t('newPassword')}
        </label>
        <input
          id="newPassword"
          type="password"
          required
          minLength={8}
          className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder={t('enterNewPassword')}
          value={newPassword}
          onChange={(e) => onNewPasswordChange(e.target.value)}
          disabled={isLoading}
        />
        <p className="mt-1 text-xs text-gray-500">{t('mustBeAtLeast8Chars')}</p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
          {t('confirmPassword')}
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder={t('confirmNewPassword')}
          value={confirmPassword}
          onChange={(e) => onConfirmPasswordChange(e.target.value)}
          disabled={isLoading}
        />
        {confirmPassword && newPassword !== confirmPassword && (
          <p className="mt-1 text-xs text-red-500">{t('passwordsDoNotMatch')}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || newPassword.length < 8 || newPassword !== confirmPassword}
        className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-primary hover:bg-primary-hover disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <LoadingSpinner />
            {t('resetting')}
          </>
        ) : (
          t('resetPassword')
        )}
      </button>
    </form>
  );
}

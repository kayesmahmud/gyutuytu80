'use client';

import { useTranslations } from 'next-intl';
import { LoadingSpinner } from './LoadingSpinner';

interface OtpVerificationStepProps {
  otp: string[];
  isLoading: boolean;
  isResending: boolean;
  cooldown: number;
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  onOtpChange: (index: number, value: string) => void;
  onOtpKeyDown: (index: number, e: React.KeyboardEvent) => void;
  onSubmit: (e: React.FormEvent) => void;
  onResendOtp: () => void;
}

export function OtpVerificationStep({
  otp,
  isLoading,
  isResending,
  cooldown,
  inputRefs,
  onOtpChange,
  onOtpKeyDown,
  onSubmit,
  onResendOtp,
}: OtpVerificationStepProps) {
  const t = useTranslations('auth');
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
          {t('enter6DigitCode')}
        </label>
        <div className="flex justify-center gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              onChange={(e) => onOtpChange(index, e.target.value)}
              onKeyDown={(e) => onOtpKeyDown(index, e)}
              className="w-12 h-14 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isLoading}
            />
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || otp.join('').length !== 6}
        className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-primary hover:bg-primary-hover disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <LoadingSpinner />
            {t('verifying')}
          </>
        ) : (
          t('verifyCode')
        )}
      </button>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          {t('didntReceiveCode')}{' '}
          {cooldown > 0 ? (
            <span className="text-gray-500">{t('resendIn', { seconds: cooldown })}</span>
          ) : (
            <button
              type="button"
              onClick={onResendOtp}
              disabled={isResending}
              className="text-primary hover:text-primary-hover font-medium disabled:opacity-50"
            >
              {isResending ? t('sending') : t('resendOtp')}
            </button>
          )}
        </p>
      </div>
    </form>
  );
}

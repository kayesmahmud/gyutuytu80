'use client';

import { useTranslations } from 'next-intl';
import { usePhoneVerification } from '@/hooks/usePhoneVerification';
import { OtpInput } from './OtpInput';

interface PhoneVerificationSectionProps {
  isPhoneVerified: boolean;
  currentPhone: string | null;
  onPhoneVerified: () => void;
}

export function PhoneVerificationSection({
  isPhoneVerified,
  currentPhone,
  onPhoneVerified,
}: PhoneVerificationSectionProps) {
  const t = useTranslations('profile');
  const tc = useTranslations('common');
  const phoneVerification = usePhoneVerification({ onSuccess: onPhoneVerified });

  const formatPhoneDisplay = (phone: string | null) => {
    if (!phone) return '';
    if (phone.length < 10) return phone;
    return `${phone.slice(0, 3)}****${phone.slice(-3)}`;
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('phoneVerification')}</h3>
        <p className="text-sm text-gray-500">{t('verifyPhoneToPost')}</p>
      </div>

      {phoneVerification.success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {phoneVerification.success}
        </div>
      )}

      {isPhoneVerified ? (
        <PhoneVerifiedView
          phone={currentPhone}
          formatPhoneDisplay={formatPhoneDisplay}
          phoneVerification={phoneVerification}
          t={t}
          tc={tc}
        />
      ) : (
        <PhoneNotVerifiedView phoneVerification={phoneVerification} t={t} tc={tc} />
      )}
    </div>
  );
}

function PhoneVerifiedView({
  phone,
  formatPhoneDisplay,
  phoneVerification,
  t,
  tc,
}: {
  phone: string | null;
  formatPhoneDisplay: (phone: string | null) => string;
  phoneVerification: ReturnType<typeof usePhoneVerification>;
  t: ReturnType<typeof useTranslations>;
  tc: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="max-w-md">
      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{formatPhoneDisplay(phone)}</p>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {t('verified')}
            </p>
          </div>
        </div>
        <button
          onClick={phoneVerification.startVerification}
          className="px-4 py-2 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
        >
          {t('change')}
        </button>
      </div>

      {phoneVerification.step !== 'idle' && (
        <PhoneVerificationForm phoneVerification={phoneVerification} t={t} tc={tc} />
      )}
    </div>
  );
}

function PhoneNotVerifiedView({
  phoneVerification,
  t,
  tc,
}: {
  phoneVerification: ReturnType<typeof usePhoneVerification>;
  t: ReturnType<typeof useTranslations>;
  tc: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="max-w-md">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-800">{t('phoneNotVerified')}</p>
            <p className="text-xs text-amber-700 mt-0.5">{t('verifyPhoneToPostSecurely')}</p>
          </div>
        </div>
      </div>

      {phoneVerification.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {phoneVerification.error}
        </div>
      )}

      <PhoneVerificationForm phoneVerification={phoneVerification} showInitialForm t={t} tc={tc} />
    </div>
  );
}

function PhoneVerificationForm({
  phoneVerification,
  showInitialForm = false,
  t,
  tc,
}: {
  phoneVerification: ReturnType<typeof usePhoneVerification>;
  showInitialForm?: boolean;
  t: ReturnType<typeof useTranslations>;
  tc: ReturnType<typeof useTranslations>;
}) {
  const showEnterPhone = showInitialForm
    ? phoneVerification.step === 'idle' || phoneVerification.step === 'enter_phone'
    : phoneVerification.step === 'enter_phone';

  if (showEnterPhone) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="space-y-4">
          {!showInitialForm && (
            <p className="text-sm text-gray-600">{t('enterNewPhoneToVerify')}</p>
          )}
          {phoneVerification.error && !showInitialForm && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {phoneVerification.error}
            </div>
          )}
          <div>
            {showInitialForm && (
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('phoneNumber')}
              </label>
            )}
            <div className="flex gap-2">
              <input
                type="tel"
                value={phoneVerification.phoneToVerify}
                onChange={(e) => phoneVerification.setPhoneToVerify(e.target.value.replace(/\D/g, ''))}
                placeholder="98XXXXXXXX"
                maxLength={10}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                onClick={phoneVerification.sendOtp}
                disabled={phoneVerification.isSendingOtp || phoneVerification.phoneToVerify.length < 10 || phoneVerification.cooldown > 0}
                className="px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {phoneVerification.isSendingOtp ? t('sending') : phoneVerification.cooldown > 0 ? t('waitSeconds', { seconds: phoneVerification.cooldown }) : t('sendOtp')}
              </button>
            </div>
            {showInitialForm && (
              <p className="text-xs text-gray-500 mt-1.5">{t('enterNepaliPhone')}</p>
            )}
          </div>
          {!showInitialForm && (
            <button
              onClick={phoneVerification.cancelVerification}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {tc('cancel')}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phoneVerification.step === 'enter_otp') {
    const otpStatus = phoneVerification.success ? 'success' : phoneVerification.error ? 'error' : 'idle';

    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              {t('enterOtpSentTo', { phone: phoneVerification.phoneToVerify })}
            </label>

            <OtpInput
              value={phoneVerification.otp}
              onChange={phoneVerification.setOtp}
              status={otpStatus}
              disabled={phoneVerification.isVerifying}
            />

            {phoneVerification.error && (
              <div className="mt-3 text-center text-sm text-red-600 flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {phoneVerification.error}
              </div>
            )}

            {phoneVerification.success && (
              <div className="mt-3 text-center text-sm text-green-600 flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {phoneVerification.success}
              </div>
            )}

            <button
              onClick={phoneVerification.verifyOtp}
              disabled={phoneVerification.isVerifying || phoneVerification.otp.length !== 6}
              className="w-full mt-4 px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {phoneVerification.isVerifying ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('verifying')}
                </span>
              ) : (
                t('verifyOtp')
              )}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={phoneVerification.changeNumber}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {t('changeNumber')}
            </button>
            <button
              onClick={phoneVerification.sendOtp}
              disabled={phoneVerification.isSendingOtp || phoneVerification.cooldown > 0}
              className="text-sm text-primary hover:text-primary-hover disabled:text-gray-400"
            >
              {phoneVerification.cooldown > 0 ? t('resendIn', { seconds: phoneVerification.cooldown }) : t('resendOtp')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

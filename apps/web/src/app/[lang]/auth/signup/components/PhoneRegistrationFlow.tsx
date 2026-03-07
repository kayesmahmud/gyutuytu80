'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import type { PhoneStep, FormData } from './types';

interface PhoneRegistrationFlowProps {
  phoneStep: PhoneStep;
  setPhoneStep: (step: PhoneStep) => void;
  phone: string;
  setPhone: (phone: string) => void;
  otp: string;
  setOtp: (otp: string) => void;
  otpCooldown: number;
  otpExpiry: number;
  formData: FormData;
  setFormData: (data: FormData) => void;
  isLoading: boolean;
  onSendOtp: () => void;
  onVerifyOtp: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formatTime: (seconds: number) => string;
  clearMessages: () => void;
}

export function PhoneRegistrationFlow({
  phoneStep,
  setPhoneStep,
  phone,
  setPhone,
  otp,
  setOtp,
  otpCooldown,
  otpExpiry,
  formData,
  setFormData,
  isLoading,
  onSendOtp,
  onVerifyOtp,
  onSubmit,
  formatTime,
  clearMessages,
}: PhoneRegistrationFlowProps) {
  const t = useTranslations('auth');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="space-y-6">
      {/* Step 1: Phone Number */}
      {phoneStep === 'phone' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              {t('phone')} *
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                +977
              </span>
              <input
                id="phone"
                type="tel"
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
                placeholder="98XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                disabled={isLoading}
                maxLength={10}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">{t('enterPhone')}</p>
          </div>

          <Button
            type="button"
            variant="primary"
            fullWidth
            loading={isLoading}
            disabled={isLoading || otpCooldown > 0 || phone.length !== 10}
            onClick={onSendOtp}
          >
            {otpCooldown > 0 ? t('resendIn', { seconds: otpCooldown }) : t('sendOtp')}
          </Button>
        </div>
      )}

      {/* Step 2: OTP Verification */}
      {phoneStep === 'otp' && (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">
              {t('otpSentTo')} <span className="font-medium">+977 {phone}</span>
            </p>
            {otpExpiry > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {t('expiresIn')} {formatTime(otpExpiry)}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
              {t('enterOtp')} *
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              required
              className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors text-center text-2xl tracking-widest"
              placeholder="------"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={isLoading}
              maxLength={6}
            />
          </div>

          <Button
            type="button"
            variant="primary"
            fullWidth
            loading={isLoading}
            disabled={isLoading || otp.length !== 6}
            onClick={onVerifyOtp}
          >
            {t('verifyOtp')}
          </Button>

          <div className="flex justify-between items-center text-sm">
            <button
              type="button"
              onClick={() => {
                setPhoneStep('phone');
                setOtp('');
                clearMessages();
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              {t('changeNumber')}
            </button>
            <button
              type="button"
              onClick={onSendOtp}
              disabled={isLoading || otpCooldown > 0}
              className="text-rose-500 hover:text-rose-600 disabled:text-gray-400"
            >
              {otpCooldown > 0 ? t('resendIn', { seconds: otpCooldown }) : t('resendOtp')}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Details Form */}
      {phoneStep === 'details' && (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="text-center mb-4 pb-4 border-b border-gray-200">
            <div className="inline-flex items-center gap-2 text-green-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">+977 {phone} ✓</span>
            </div>
          </div>

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
              {t('fullName')} *
            </label>
            <input
              id="fullName"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
              placeholder={t('enterFullName')}
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              {t('password')} *
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
                placeholder={t('atLeast6Chars')}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              {t('confirmPassword')} *
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
                placeholder={t('reenterPassword')}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-start">
            <input
              id="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-rose-500 border-gray-300 rounded focus:ring-rose-500 mt-0.5"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
              {t('agreeTermsAndPrivacy')}{' '}
              <a href="#" className="text-rose-500 hover:text-rose-600 transition-colors">
                {t('termsAndConditions')}
              </a>{' '}
              {t('and')}{' '}
              <a href="#" className="text-rose-500 hover:text-rose-600 transition-colors">
                {t('privacyPolicy')}
              </a>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? t('creatingAccount') : t('createAccount')}
          </Button>
        </form>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface FailureDetails {
  orderId: string;
  status: string;
  error: string;
}

export default function PaymentFailurePage() {
  const searchParams = useSearchParams();
  const t = useTranslations('payment');
  const [details, setDetails] = useState<FailureDetails | null>(null);

  useEffect(() => {
    const orderId = searchParams.get('orderId') || '';
    const status = searchParams.get('status') || 'failed';
    const error = searchParams.get('error') || '';

    setDetails({ orderId, status, error });
  }, [searchParams]);

  const getErrorMessage = (error: string, status: string) => {
    if (error === 'canceled' || status === 'canceled') {
      return t('errorCanceled');
    }
    if (error === 'missing_order') {
      return t('errorMissingOrder');
    }
    if (error === 'transaction_not_found') {
      return t('errorTransactionNotFound');
    }
    if (error === 'invalid_gateway') {
      return t('errorInvalidGateway');
    }
    if (error === 'internal_error') {
      return t('errorInternalError');
    }
    if (status === 'pending') {
      return t('errorPending');
    }
    if (status === 'expired') {
      return t('errorExpired');
    }
    return error || t('errorDefault');
  };

  const getStatusColor = (status: string) => {
    if (status === 'pending') return 'from-yellow-500 to-orange-500';
    if (status === 'canceled') return 'from-gray-500 to-gray-600';
    return 'from-red-500 to-rose-600';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'pending') {
      return (
        <svg className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    if (status === 'canceled') {
      return (
        <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      );
    }
    return (
      <svg className="w-10 h-10 sm:w-12 sm:h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  };

  const getStatusTitle = (status: string) => {
    if (status === 'pending') return t('pendingTitle');
    if (status === 'canceled') return t('canceledTitle');
    return t('failedTitle');
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${
      details?.status === 'pending'
        ? 'from-yellow-50 via-white to-orange-50'
        : details?.status === 'canceled'
        ? 'from-gray-50 via-white to-slate-50'
        : 'from-red-50 via-white to-rose-50'
    } flex items-center justify-center p-4`}>
      <div className="w-full max-w-md">
        {/* Failure Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className={`bg-gradient-to-r ${getStatusColor(details?.status || 'failed')} p-6 sm:p-8 text-center relative overflow-hidden`}>
            {/* Background pattern */}
            <div className="absolute inset-0 overflow-hidden opacity-10">
              <svg className="absolute -right-10 -top-10 w-40 h-40" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="8" fill="none" />
                <path d="M30 30 L70 70 M70 30 L30 70" stroke="white" strokeWidth="8" />
              </svg>
            </div>

            {/* Icon */}
            <div className="relative z-10">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg">
                {getStatusIcon(details?.status || 'failed')}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mt-4">
                {getStatusTitle(details?.status || 'failed')}
              </h1>
            </div>
          </div>

          {/* Details */}
          <div className="p-5 sm:p-6">
            {/* Error Message */}
            <div className={`p-4 rounded-xl ${
              details?.status === 'pending'
                ? 'bg-yellow-50 border border-yellow-200'
                : details?.status === 'canceled'
                ? 'bg-gray-50 border border-gray-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {details?.status === 'pending' ? (
                    <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <p className={`text-sm ${
                  details?.status === 'pending' ? 'text-yellow-800' :
                  details?.status === 'canceled' ? 'text-gray-700' : 'text-red-800'
                }`}>
                  {getErrorMessage(details?.error || '', details?.status || 'failed')}
                </p>
              </div>
            </div>

            {/* Transaction Info */}
            {details?.orderId && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">{t('referenceId')}</span>
                  <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {details.orderId.slice(0, 24)}...
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-500 text-sm">{t('status')}</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                    details.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : details.status === 'canceled'
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      details.status === 'pending' ? 'bg-yellow-500 animate-pulse' :
                      details.status === 'canceled' ? 'bg-gray-500' : 'bg-red-500'
                    }`} />
                    {details.status === 'pending' ? t('processing') :
                     details.status === 'canceled' ? t('canceled') : t('failed')}
                  </span>
                </div>
              </div>
            )}

            {/* Help Section */}
            <div className="mt-5 p-4 bg-blue-50 rounded-xl">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('needHelp')}
              </h3>
              <ul className="mt-2 text-sm text-gray-600 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  {t('helpTip1')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  {t('helpTip2')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  {t('helpTip3')}
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 space-y-3">
              <Link
                href="/en/dashboard"
                className="block w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-center font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25"
              >
                {t('tryAgain')}
              </Link>

              <Link
                href="/en/dashboard"
                className="block w-full py-3 px-4 bg-gray-100 text-gray-700 text-center font-medium rounded-xl hover:bg-gray-200 transition-all"
              >
                {t('goToDashboard')}
              </Link>
            </div>
          </div>
        </div>

        {/* Support Contact */}
        <div className="mt-4 p-4 bg-white/80 backdrop-blur rounded-xl text-center">
          <p className="text-gray-600 text-sm">
            {t('moneyDeductedNotice')}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            {t('refundNotice')}
          </p>
          <a
            href="mailto:support@thulobazaar.com"
            className="inline-flex items-center gap-1.5 mt-3 text-blue-600 text-sm font-medium hover:text-blue-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {t('contactSupport')}
          </a>
        </div>
      </div>
    </div>
  );
}

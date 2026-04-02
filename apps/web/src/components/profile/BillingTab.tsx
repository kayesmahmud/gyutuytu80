'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';
import type { PaymentTransaction, PaymentType, PaymentStatus } from '@thulobazaar/types';

interface BillingTabProps {
  lang: string;
}

const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  ad_promotion: 'Ad Promotion',
  individual_verification: 'Individual Verification',
  business_verification: 'Business Verification',
};

const STATUS_STYLES: Record<PaymentStatus, { bg: string; text: string; label: string }> = {
  verified: { bg: 'bg-green-50', text: 'text-green-700', label: 'Paid' },
  pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pending' },
  failed: { bg: 'bg-red-50', text: 'text-red-700', label: 'Failed' },
  canceled: { bg: 'bg-gray-50', text: 'text-gray-500', label: 'Canceled' },
};

type FilterType = 'all' | PaymentType;

export function BillingTab({ lang }: BillingTabProps) {
  const t = useTranslations('profile');

  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<FilterType>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchHistory = useCallback(async (pageNum: number, typeFilter: FilterType) => {
    setLoading(true);
    setError(null);
    try {
      const params: { page: number; limit: number; type?: string } = {
        page: pageNum,
        limit: 10,
      };
      if (typeFilter !== 'all') {
        params.type = typeFilter;
      }
      const response = await apiClient.getPaymentHistory(params);
      if (response.success) {
        setTransactions(response.data);
        setTotalPages(response.pagination.totalPages);
      } else {
        setError('Failed to load billing history');
      }
    } catch {
      setError('Failed to load billing history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(page, filter);
  }, [page, filter, fetchHistory]);

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    setPage(1);
  };

  const handleDownloadReceipt = async (transactionId: string) => {
    setDownloadingId(transactionId);
    try {
      const blob = await apiClient.downloadReceipt(transactionId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${transactionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download receipt. Only verified payments have receipts.');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatAmount = (amount: number) => {
    return `NPR ${amount.toLocaleString('en-NP', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatGateway = (gateway: string) => {
    return gateway === 'khalti' ? 'Khalti' : gateway === 'esewa' ? 'eSewa' : gateway;
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{t('billingTitle')}</h3>
        <p className="text-sm text-gray-500 mt-1">{t('billingSubtitle')}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'ad_promotion', 'individual_verification', 'business_verification'] as FilterType[]).map(
          (f) => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                filter === f
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {f === 'all' ? t('billingFilterAll') : PAYMENT_TYPE_LABELS[f]}
            </button>
          )
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button onClick={() => fetchHistory(page, filter)} className="ml-2 underline">
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && transactions.length === 0 && (
        <div className="text-center py-16">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
          </svg>
          <p className="text-gray-500 font-medium">{t('billingEmpty')}</p>
          <p className="text-gray-400 text-sm mt-1">{t('billingEmptySubtitle')}</p>
        </div>
      )}

      {/* Transactions list */}
      {transactions.length > 0 && (
        <div className="space-y-3">
          {transactions.map((tx) => {
            const statusStyle = STATUS_STYLES[tx.status] || STATUS_STYLES.pending;
            return (
              <div
                key={tx.transactionId}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Details */}
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Gateway icon */}
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        tx.gateway === 'khalti'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      <span className="text-lg font-bold">
                        {tx.gateway === 'khalti' ? 'K' : 'e'}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">
                        {PAYMENT_TYPE_LABELS[tx.paymentType] || tx.paymentType}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {formatDate(tx.createdAt)} &middot; {formatGateway(tx.gateway)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 font-mono truncate">
                        {tx.transactionId}
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount + Status + Download */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <p className="font-semibold text-gray-900">{formatAmount(tx.amount)}</p>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                      {statusStyle.label}
                    </span>
                    {tx.status === 'verified' && (
                      <button
                        onClick={() => handleDownloadReceipt(tx.transactionId)}
                        disabled={downloadingId === tx.transactionId}
                        className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover transition-colors disabled:opacity-50"
                      >
                        {downloadingId === tx.transactionId ? (
                          <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                        {t('billingDownloadReceipt')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            {t('billingPrevious')}
          </button>
          <span className="text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            {t('billingNext')}
          </button>
        </div>
      )}
    </div>
  );
}

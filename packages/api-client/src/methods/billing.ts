/**
 * Billing Methods
 * Payment history and receipt downloads
 */

import type { AxiosInstance } from 'axios';
import type { PaymentTransaction, PaymentHistoryResponse } from '@thulobazaar/types';

export function createBillingMethods(client: AxiosInstance) {
  return {
    async getPaymentHistory(params?: {
      page?: number;
      limit?: number;
      status?: string;
      type?: string;
    }): Promise<{ success: boolean; data: PaymentTransaction[]; pagination: PaymentHistoryResponse['pagination'] }> {
      const response = await client.get('/api/payments/history', { params });
      return response.data;
    },

    getReceiptUrl(transactionId: string): string {
      return `/api/payments/${transactionId}/receipt`;
    },

    async downloadReceipt(transactionId: string): Promise<Blob> {
      const response = await client.get(`/api/payments/${transactionId}/receipt`, {
        responseType: 'blob',
      });
      return response.data;
    },
  };
}

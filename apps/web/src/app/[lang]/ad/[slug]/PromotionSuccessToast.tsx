'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui';

interface PromotionSuccessToastProps {
  promoted: boolean;
  txnId?: string;
}

export default function PromotionSuccessToast({ promoted, txnId }: PromotionSuccessToastProps) {
  const { success } = useToast();
  const t = useTranslations('ads');

  useEffect(() => {
    if (promoted) {
      success(
        txnId
          ? t('promotionActivatedWithTxn', { txnId })
          : t('promotionActivated')
      );
    }
  }, [promoted, txnId, success, t]);

  return null;
}

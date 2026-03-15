'use client';

import { useUserAuth } from '@/contexts/UserAuthContext';
import { useTranslations } from 'next-intl';

interface OwnerGuardProps {
  sellerId: number | null;
  children: React.ReactNode;
}

export function OwnerGuard({ sellerId, children }: OwnerGuardProps) {
  const { user } = useUserAuth();
  const t = useTranslations('ads');
  const isOwner = user?.id != null && sellerId != null && String(user.id) === String(sellerId);

  if (!isOwner) return <>{children}</>;

  return (
    <div>
      <p style={{
        textAlign: 'center',
        fontSize: '0.8rem',
        color: '#9ca3af',
        marginBottom: '0.5rem',
        fontStyle: 'italic',
      }}>
        {t('thisIsYourAd')}
      </p>
      <div style={{
        opacity: 0.4,
        pointerEvents: 'none',
        cursor: 'default',
      }}>
        {children}
      </div>
    </div>
  );
}

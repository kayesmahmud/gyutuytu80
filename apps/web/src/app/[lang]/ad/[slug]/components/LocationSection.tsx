import { MapPin } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { LocationSectionProps } from './types';

export async function LocationSection({ fullLocation, locationType }: LocationSectionProps) {
  const t = await getTranslations('ads');

  if (!fullLocation) {
    return null;
  }

  return (
    <div>
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        marginBottom: '1rem',
        color: '#1f2937'
      }}>
        {t('location')}
      </h2>
      <div style={{
        padding: '1rem',
        background: '#f9fafb',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <MapPin
          size={24}
          className="text-red-500 flex-shrink-0"
          strokeWidth={2}
        />
        <div>
          <div style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            {fullLocation}
          </div>
          {locationType && (
            <div style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              textTransform: 'capitalize'
            }}>
              {locationType.replace('_', ' ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { getTranslations } from 'next-intl/server';

export async function SafetyTips() {
  const t = await getTranslations('ads');

  return (
    <div style={{
      background: '#fff7ed',
      borderRadius: '12px',
      padding: '1.5rem',
      border: '1px solid #fed7aa'
    }}>
      <h4 style={{
        fontSize: '1rem',
        fontWeight: '600',
        marginBottom: '1rem',
        color: '#9a3412'
      }}>
        {t('safetyTips')}
      </h4>
      <ul style={{
        fontSize: '0.875rem',
        color: '#78350f',
        lineHeight: '1.7',
        paddingLeft: '1.25rem'
      }}>
        <li>{t('safetyTip1')}</li>
        <li>{t('safetyTip2')}</li>
        <li>{t('safetyTip3')}</li>
        <li>{t('safetyTip4')}</li>
      </ul>
    </div>
  );
}

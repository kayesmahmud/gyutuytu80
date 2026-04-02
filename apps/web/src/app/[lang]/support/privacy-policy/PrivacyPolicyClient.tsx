'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Shield, Database, Cookie, Users, Lock, Trash2, Baby, RefreshCw, Mail } from 'lucide-react';

export default function PrivacyPolicyClient() {
  const t = useTranslations('privacyPolicy');
  const params = useParams();
  const lang = params.lang as string;

  const sections = [
    {
      id: 'information-we-collect',
      icon: <Database className="w-5 h-5" />,
      title: t('informationWeCollect'),
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-800 mb-1">{t('accountInfo')}</h4>
            <p className="text-gray-600">{t('accountInfoDesc')}</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-1">{t('profileInfo')}</h4>
            <p className="text-gray-600">{t('profileInfoDesc')}</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-1">{t('verificationDocs')}</h4>
            <p className="text-gray-600">{t('verificationDocsDesc')}</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-1">{t('adData')}</h4>
            <p className="text-gray-600">{t('adDataDesc')}</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-1">{t('messagingData')}</h4>
            <p className="text-gray-600">{t('messagingDataDesc')}</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-1">{t('paymentInfo')}</h4>
            <p className="text-gray-600">{t('paymentInfoDesc')}</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-1">{t('locationData')}</h4>
            <p className="text-gray-600">{t('locationDataDesc')}</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-1">{t('usageData')}</h4>
            <p className="text-gray-600">{t('usageDataDesc')}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'how-we-use',
      icon: <Users className="w-5 h-5" />,
      title: t('howWeUseInfo'),
      content: <p className="text-gray-600">{t('howWeUseInfoDesc')}</p>,
    },
    {
      id: 'cookies',
      icon: <Cookie className="w-5 h-5" />,
      title: t('cookiesAndTracking'),
      content: <p className="text-gray-600">{t('cookiesAndTrackingDesc')}</p>,
    },
    {
      id: 'third-party',
      icon: <Users className="w-5 h-5" />,
      title: t('thirdPartyServices'),
      content: (
        <div className="space-y-3">
          <p className="text-gray-600">{t('thirdPartyServicesDesc')}</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
            <li>{t('thirdPartyKhalti')}</li>
            <li>{t('thirdPartyEsewa')}</li>
            <li>{t('thirdPartyGoogle')}</li>
            <li>{t('thirdPartyFirebase')}</li>
            <li>{t('thirdPartySMS')}</li>
          </ul>
          <p className="text-gray-500 text-sm italic">{t('thirdPartyNote')}</p>
        </div>
      ),
    },
    {
      id: 'data-retention',
      icon: <Trash2 className="w-5 h-5" />,
      title: t('dataRetention'),
      content: (
        <div className="space-y-3">
          <p className="text-gray-600">{t('dataRetentionDesc')}</p>
          <div>
            <h4 className="font-semibold text-gray-800 mb-1">{t('dataDeletionProcess')}</h4>
            <p className="text-gray-600">{t('dataDeletionProcessDesc')}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'security',
      icon: <Lock className="w-5 h-5" />,
      title: t('dataSecurity'),
      content: <p className="text-gray-600">{t('dataSecurityDesc')}</p>,
    },
    {
      id: 'your-rights',
      icon: <Shield className="w-5 h-5" />,
      title: t('yourRights'),
      content: <p className="text-gray-600">{t('yourRightsDesc')}</p>,
    },
    {
      id: 'childrens-privacy',
      icon: <Baby className="w-5 h-5" />,
      title: t('childrensPrivacy'),
      content: <p className="text-gray-600">{t('childrensPrivacyDesc')}</p>,
    },
    {
      id: 'changes',
      icon: <RefreshCw className="w-5 h-5" />,
      title: t('changesToPolicy'),
      content: <p className="text-gray-600">{t('changesToPolicyDesc')}</p>,
    },
    {
      id: 'contact',
      icon: <Mail className="w-5 h-5" />,
      title: t('contactUs'),
      content: (
        <p className="text-gray-600">
          {t('contactUsDesc')}{' '}
          <Link href={`/${lang}/contact`} className="text-rose-600 hover:text-rose-700 underline">
            {t('contactUs')}
          </Link>
        </p>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-10 md:py-16 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 opacity-90" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3">{t('title')}</h1>
          <p className="text-sm sm:text-base opacity-80">
            {t('lastUpdated', { date: '2026-04-02' })}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Introduction */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <p className="text-gray-700 leading-relaxed">{t('intro')}</p>
        </div>

        {/* Table of Contents - Desktop */}
        <nav className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Contents</h3>
          <ul className="grid grid-cols-2 gap-2">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-2"
                >
                  {section.icon}
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 scroll-mt-4"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg text-sm font-bold">
                  {index + 1}
                </div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900">{section.title}</h2>
              </div>
              <div className="leading-relaxed">{section.content}</div>
            </section>
          ))}
        </div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Link
            href={`/${lang}`}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
          >
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

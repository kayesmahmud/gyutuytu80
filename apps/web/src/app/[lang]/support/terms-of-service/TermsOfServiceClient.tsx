'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import {
  FileText, UserCheck, Megaphone, Ban, CreditCard, Star,
  ShieldCheck, Trash2, MessageSquare, Eye, Scale, Gavel,
  RefreshCw, Mail, AlertTriangle,
} from 'lucide-react';

export default function TermsOfServiceClient() {
  const t = useTranslations('termsOfService');
  const params = useParams();
  const lang = params.lang as string;

  const sections = [
    {
      id: 'acceptance',
      icon: <FileText className="w-5 h-5" />,
      title: t('acceptanceOfTerms'),
      content: <p className="text-gray-600">{t('acceptanceOfTermsDesc')}</p>,
    },
    {
      id: 'account',
      icon: <UserCheck className="w-5 h-5" />,
      title: t('accountRegistration'),
      content: <p className="text-gray-600">{t('accountRegistrationDesc')}</p>,
    },
    {
      id: 'posting-ads',
      icon: <Megaphone className="w-5 h-5" />,
      title: t('postingAds'),
      content: <p className="text-gray-600">{t('postingAdsDesc')}</p>,
    },
    {
      id: 'prohibited',
      icon: <Ban className="w-5 h-5" />,
      title: t('prohibitedContent'),
      content: <p className="text-gray-600">{t('prohibitedContentDesc')}</p>,
    },
    {
      id: 'payments',
      icon: <CreditCard className="w-5 h-5" />,
      title: t('paymentsTitle'),
      content: <p className="text-gray-600">{t('paymentsDesc')}</p>,
    },
    {
      id: 'promotions',
      icon: <Star className="w-5 h-5" />,
      title: t('promotionsTitle'),
      content: (
        <div className="space-y-3">
          <p className="text-gray-600">{t('promotionsDesc')}</p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-800 text-sm">{t('promotionsIssue')}</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'verification',
      icon: <ShieldCheck className="w-5 h-5" />,
      title: t('verificationTitle'),
      content: (
        <div className="space-y-3">
          <p className="text-gray-600">{t('verificationDesc')}</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm font-medium">{t('verificationRefund')}</p>
            </div>
          </div>
          <p className="text-gray-600">{t('verificationExpiry')}</p>
        </div>
      ),
    },
    {
      id: 'refund-policy',
      icon: <CreditCard className="w-5 h-5" />,
      title: t('refundPolicyTitle'),
      content: (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-rose-500 font-bold mt-0.5">1.</span>
            <p className="text-gray-700">{t('refundPromotion')}</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-rose-500 font-bold mt-0.5">2.</span>
            <p className="text-gray-700">{t('refundVerification')}</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-rose-500 font-bold mt-0.5">3.</span>
            <p className="text-gray-700">{t('refundGeneral')}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'account-deletion',
      icon: <Trash2 className="w-5 h-5" />,
      title: t('accountDeletion'),
      content: (
        <div className="space-y-3">
          <p className="text-gray-600">{t('accountDeletionDesc')}</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">{t('accountDeletionProcess')}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{t('accountDeletionFinal')}</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'messaging',
      icon: <MessageSquare className="w-5 h-5" />,
      title: t('messaging'),
      content: <p className="text-gray-600">{t('messagingDesc')}</p>,
    },
    {
      id: 'moderation',
      icon: <Eye className="w-5 h-5" />,
      title: t('contentModeration'),
      content: <p className="text-gray-600">{t('contentModerationDesc')}</p>,
    },
    {
      id: 'intellectual-property',
      icon: <Scale className="w-5 h-5" />,
      title: t('intellectualProperty'),
      content: <p className="text-gray-600">{t('intellectualPropertyDesc')}</p>,
    },
    {
      id: 'liability',
      icon: <AlertTriangle className="w-5 h-5" />,
      title: t('limitationOfLiability'),
      content: <p className="text-gray-600">{t('limitationOfLiabilityDesc')}</p>,
    },
    {
      id: 'governing-law',
      icon: <Gavel className="w-5 h-5" />,
      title: t('governingLaw'),
      content: <p className="text-gray-600">{t('governingLawDesc')}</p>,
    },
    {
      id: 'changes',
      icon: <RefreshCw className="w-5 h-5" />,
      title: t('changesToTerms'),
      content: <p className="text-gray-600">{t('changesToTermsDesc')}</p>,
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
      <div className="bg-gradient-to-br from-rose-600 via-pink-600 to-orange-500 text-white">
        <div className="max-w-4xl mx-auto px-4 py-10 md:py-16 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-90" />
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
                  className="text-sm text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-2"
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
                <div className="flex items-center justify-center w-8 h-8 bg-rose-100 text-rose-600 rounded-lg text-sm font-bold">
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
            className="inline-flex items-center text-rose-600 hover:text-rose-800 font-medium"
          >
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  titleKey: string;
  icon: string;
  descKey: string;
  qKeys: string[];
}

const FAQ_CATEGORY_DEFS: FAQCategory[] = [
  { id: 'getting-started', titleKey: 'gettingStartedTitle', icon: '🚀', descKey: 'gettingStartedDesc', qKeys: ['gettingStartedQ1', 'gettingStartedQ2', 'gettingStartedQ3', 'gettingStartedQ4'] },
  { id: 'posting-ads', titleKey: 'postingAdsTitle', icon: '📝', descKey: 'postingAdsDesc', qKeys: ['postingAdsQ1', 'postingAdsQ2', 'postingAdsQ3', 'postingAdsQ4', 'postingAdsQ5'] },
  { id: 'buying', titleKey: 'buyingTitle', icon: '🛒', descKey: 'buyingDesc', qKeys: ['buyingQ1', 'buyingQ2', 'buyingQ3', 'buyingQ4'] },
  { id: 'account', titleKey: 'accountTitle', icon: '👤', descKey: 'accountDesc', qKeys: ['accountQ1', 'accountQ2', 'accountQ3', 'accountQ4'] },
  { id: 'payments', titleKey: 'paymentsTitle', icon: '💳', descKey: 'paymentsDesc', qKeys: ['paymentsQ1', 'paymentsQ2', 'paymentsQ3', 'paymentsQ4'] },
  { id: 'safety', titleKey: 'safetyTitle', icon: '🔒', descKey: 'safetyDesc', qKeys: ['safetyQ1', 'safetyQ2', 'safetyQ3', 'safetyQ4'] },
];

export default function HelpClient() {
  const t = useTranslations('help');

  // Build translated FAQ categories from definition keys
  const FAQ_CATEGORIES = FAQ_CATEGORY_DEFS.map((def) => ({
    id: def.id,
    title: t(def.titleKey),
    icon: def.icon,
    description: t(def.descKey),
    faqs: def.qKeys.map((qKey) => ({
      question: t(qKey),
      answer: t(qKey.replace(/Q(\d+)$/, 'A$1')),
    })),
  }));
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('getting-started');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  // Filter FAQs based on search
  const filteredCategories = searchQuery
    ? FAQ_CATEGORIES.map((category) => ({
        ...category,
        faqs: category.faqs.filter(
          (faq) =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((category) => category.faqs.length > 0)
    : FAQ_CATEGORIES;

  const toggleFaq = (categoryId: string, index: number) => {
    const faqId = `${categoryId}-${index}`;
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-16 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4">{t('title')}</h1>
          <p className="text-base sm:text-lg md:text-xl opacity-90 max-w-2xl mx-auto mb-6 md:mb-8">
            {t('subtitle')}
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 pl-14 rounded-xl text-gray-900 text-lg focus:ring-4 focus:ring-white/30 focus:outline-none"
              />
              <svg
                className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4 mb-8 md:mb-12">
          {FAQ_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setExpandedCategory(category.id);
                setSearchQuery('');
                // Scroll to category
                document.getElementById(category.id)?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`p-3 sm:p-4 rounded-xl text-center transition-all hover:shadow-md ${
                expandedCategory === category.id
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{category.icon}</div>
              <div className="font-medium text-xs sm:text-sm">{category.title}</div>
            </button>
          ))}
        </div>

        {/* Search Results or FAQ Categories */}
        {searchQuery && filteredCategories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('noResults')}</h3>
            <p className="text-gray-600 mb-6">
              {t('noResultsFor', { query: searchQuery })}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setSearchQuery('')}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('clearSearch')}
              </button>
              <Link
                href="/contact"
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {t('contactSupport')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-8">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                id={category.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                  className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="text-3xl sm:text-4xl">{category.icon}</div>
                    <div className="text-left">
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">{category.title}</h2>
                      <p className="text-gray-500 text-sm sm:text-base">{category.description}</p>
                    </div>
                  </div>
                  <svg
                    className={`w-6 h-6 text-gray-400 transition-transform ${
                      expandedCategory === category.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expandedCategory === category.id && (
                  <div className="border-t border-gray-100">
                    {category.faqs.map((faq, index) => (
                      <div key={index} className="border-b border-gray-100 last:border-b-0">
                        <button
                          onClick={() => toggleFaq(category.id, index)}
                          className="w-full p-4 sm:p-6 flex items-start justify-between text-left hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-medium text-gray-900 pr-4 text-sm sm:text-base">{faq.question}</span>
                          <svg
                            className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                              expandedFaq === `${category.id}-${index}` ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {expandedFaq === `${category.id}-${index}` && (
                          <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-gray-600 leading-relaxed text-sm sm:text-base">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Still Need Help Section */}
        <div className="mt-8 md:mt-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl md:rounded-2xl p-6 sm:p-8 md:p-12 text-white text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 md:mb-4">{t('stillNeedHelp')}</h2>
          <p className="text-base sm:text-lg opacity-90 mb-6 md:mb-8 max-w-2xl mx-auto">
            {t('stillNeedHelpDesc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/support"
              className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {t('openSupportTicket')}
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {t('contactSupport')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

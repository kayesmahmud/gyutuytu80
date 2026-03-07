'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface FAQSectionDef {
  titleKey: string;
  icon: string;
  qKeys: string[];
}

const FAQ_SECTION_DEFS: FAQSectionDef[] = [
  { titleKey: 'generalTitle', icon: '📋', qKeys: ['generalQ1', 'generalQ2', 'generalQ3'] },
  { titleKey: 'buyingTitle', icon: '🛒', qKeys: ['buyingQ1', 'buyingQ2', 'buyingQ3'] },
  { titleKey: 'sellingTitle', icon: '💰', qKeys: ['sellingQ1', 'sellingQ2', 'sellingQ3', 'sellingQ4'] },
  { titleKey: 'paymentsTitle', icon: '💳', qKeys: ['paymentsQ1', 'paymentsQ2', 'paymentsQ3'] },
  { titleKey: 'accountTitle', icon: '👤', qKeys: ['accountQ1', 'accountQ2', 'accountQ3'] },
  { titleKey: 'safetyTitle', icon: '🔒', qKeys: ['safetyQ1', 'safetyQ2', 'safetyQ3'] },
];

export default function FAQClient() {
  const t = useTranslations('faq');
  const [expandedSection, setExpandedSection] = useState<number>(0);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  // Build translated FAQ sections from definition keys
  const FAQ_SECTIONS = FAQ_SECTION_DEFS.map((def) => ({
    title: t(def.titleKey),
    icon: def.icon,
    faqs: def.qKeys.map((qKey) => ({
      question: t(qKey),
      answer: t(qKey.replace(/Q(\d+)$/, 'A$1')),
    })),
  }));

  const toggleFaq = (sectionIndex: number, faqIndex: number) => {
    const faqId = `${sectionIndex}-${faqIndex}`;
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-16 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4">{t('title')}</h1>
          <p className="text-base sm:text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Section Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-6 md:mb-8">
          {FAQ_SECTIONS.map((section, index) => (
            <button
              key={index}
              onClick={() => setExpandedSection(index)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                expandedSection === index
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-1">{section.icon}</span>
              {section.title}
            </button>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span>{FAQ_SECTIONS[expandedSection]?.icon}</span>
              {FAQ_SECTIONS[expandedSection]?.title}
            </h2>
          </div>

          <div className="divide-y divide-gray-100">
            {FAQ_SECTIONS[expandedSection]?.faqs.map((faq, faqIndex) => (
              <div key={faqIndex}>
                <button
                  onClick={() => toggleFaq(expandedSection, faqIndex)}
                  className="w-full p-4 sm:p-6 flex items-start justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900 pr-4 text-sm sm:text-base">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                      expandedFaq === `${expandedSection}-${faqIndex}` ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedFaq === `${expandedSection}-${faqIndex}` && (
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-gray-600 leading-relaxed text-sm sm:text-base">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Still Need Help Section */}
        <div className="mt-8 md:mt-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl md:rounded-2xl p-6 sm:p-8 text-white text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 md:mb-4">{t('stillHaveQuestions')}</h2>
          <p className="opacity-90 mb-4 sm:mb-6 text-sm sm:text-base">
            {t('cantFindAnswer')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/help"
              className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              {t('visitHelpCenter')}
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-colors"
            >
              {t('contactUs')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

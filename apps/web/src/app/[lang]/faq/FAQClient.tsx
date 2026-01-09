'use client';

import { useState } from 'react';
import Link from 'next/link';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  icon: string;
  faqs: FAQItem[];
}

// TODO: Replace with real content
const FAQ_SECTIONS: FAQSection[] = [
  {
    title: 'General',
    icon: '📋',
    faqs: [
      {
        question: 'What is ThuluBazaar?',
        answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
      },
      {
        question: 'How do I create an account?',
        answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      },
      {
        question: 'Is ThuluBazaar free to use?',
        answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.',
      },
    ],
  },
  {
    title: 'Buying',
    icon: '🛒',
    faqs: [
      {
        question: 'How do I contact a seller?',
        answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      },
      {
        question: 'Is it safe to buy on ThuluBazaar?',
        answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.',
      },
      {
        question: 'Can I negotiate prices?',
        answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      },
    ],
  },
  {
    title: 'Selling',
    icon: '💰',
    faqs: [
      {
        question: 'How do I post an ad?',
        answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      },
      {
        question: 'How many photos can I upload?',
        answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.',
      },
      {
        question: 'How long do ads stay active?',
        answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      },
      {
        question: 'Why was my ad rejected?',
        answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud.',
      },
    ],
  },
  {
    title: 'Payments',
    icon: '💳',
    faqs: [
      {
        question: 'What payment methods are accepted?',
        answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      },
      {
        question: 'How do Featured Ads work?',
        answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.',
      },
      {
        question: 'Can I get a refund?',
        answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      },
    ],
  },
  {
    title: 'Account',
    icon: '👤',
    faqs: [
      {
        question: 'How do I verify my account?',
        answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      },
      {
        question: 'How do I reset my password?',
        answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.',
      },
      {
        question: 'How do I delete my account?',
        answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      },
    ],
  },
  {
    title: 'Safety',
    icon: '🔒',
    faqs: [
      {
        question: 'How can I stay safe when meeting buyers/sellers?',
        answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
      },
      {
        question: 'How do I report a suspicious user?',
        answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      },
      {
        question: 'What should I do if I encounter fraud?',
        answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.',
      },
    ],
  },
];

export default function FAQClient() {
  const [expandedSection, setExpandedSection] = useState<number>(0);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const toggleFaq = (sectionIndex: number, faqIndex: number) => {
    const faqId = `${sectionIndex}-${faqIndex}`;
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-16 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4">Frequently Asked Questions</h1>
          <p className="text-base sm:text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
            Find quick answers to common questions about ThuluBazaar
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
              <span>{FAQ_SECTIONS[expandedSection].icon}</span>
              {FAQ_SECTIONS[expandedSection].title}
            </h2>
          </div>

          <div className="divide-y divide-gray-100">
            {FAQ_SECTIONS[expandedSection].faqs.map((faq, faqIndex) => (
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
          <h2 className="text-xl sm:text-2xl font-bold mb-3 md:mb-4">Still have questions?</h2>
          <p className="opacity-90 mb-4 sm:mb-6 text-sm sm:text-base">
            Can&apos;t find the answer you&apos;re looking for? We&apos;re here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/help"
              className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Visit Help Center
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

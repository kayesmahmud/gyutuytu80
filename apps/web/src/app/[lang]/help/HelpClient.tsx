'use client';

import { useState } from 'react';
import Link from 'next/link';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  faqs: FAQItem[];
}

const FAQ_CATEGORIES: FAQCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: '🚀',
    description: 'New to ThuluBazaar? Start here.',
    faqs: [
      {
        question: 'What is ThuluBazaar?',
        answer: 'ThuluBazaar is Nepal\'s leading online classifieds marketplace where you can buy, sell, and rent products and services. We connect buyers and sellers across Nepal for electronics, vehicles, property, jobs, and much more.',
      },
      {
        question: 'How do I create an account?',
        answer: 'Click on "Sign Up" at the top of the page. You can register using your email address or phone number. You\'ll receive a verification code to confirm your account. Once verified, you can start posting ads and contacting sellers.',
      },
      {
        question: 'Is it free to use ThuluBazaar?',
        answer: 'Yes! Creating an account and browsing ads is completely free. Posting basic ads is also free. We offer optional premium features like Featured Ads, Urgent tags, and Sticky posts to help your ads get more visibility.',
      },
      {
        question: 'What can I sell on ThuluBazaar?',
        answer: 'You can sell a wide variety of items including electronics, vehicles, property, fashion, home goods, services, and more. However, illegal items, weapons, drugs, and prohibited content are strictly not allowed. Please review our Terms of Service for the complete list.',
      },
    ],
  },
  {
    id: 'posting-ads',
    title: 'Posting Ads',
    icon: '📝',
    description: 'Learn how to create effective ads.',
    faqs: [
      {
        question: 'How do I post an ad?',
        answer: 'Click "Post Free Ad" button, select a category, fill in the details including title, description, price, and photos. Add your contact information and submit. Your ad will be reviewed and published within 24 hours.',
      },
      {
        question: 'Why was my ad rejected?',
        answer: 'Ads may be rejected for various reasons: inappropriate content, misleading information, wrong category, poor quality images, or violation of our posting guidelines. You\'ll receive a notification explaining why and can edit and resubmit your ad.',
      },
      {
        question: 'How many photos can I upload?',
        answer: 'You can upload up to 10 photos per ad. We recommend using high-quality images that clearly show your item from multiple angles. The first image will be used as the primary thumbnail.',
      },
      {
        question: 'How long will my ad stay active?',
        answer: 'Standard ads remain active for 30 days. You can renew your ad before it expires. Premium and Featured ads may have different durations based on the package you choose.',
      },
      {
        question: 'Can I edit my ad after posting?',
        answer: 'Yes, you can edit your ad anytime from your Dashboard. Go to "My Ads", find the ad you want to edit, and click "Edit". Some changes may require re-review by our moderation team.',
      },
    ],
  },
  {
    id: 'buying',
    title: 'Buying',
    icon: '🛒',
    description: 'Tips for safe and smart buying.',
    faqs: [
      {
        question: 'How do I contact a seller?',
        answer: 'Click on any ad to view details, then use the "Message" button to send a message to the seller through our platform, or use the displayed phone number to call/message directly.',
      },
      {
        question: 'Is it safe to buy on ThuluBazaar?',
        answer: 'We recommend meeting sellers in public places, inspecting items before payment, and using secure payment methods. Look for verified sellers (blue checkmark) for added trust. Never send money without seeing the item.',
      },
      {
        question: 'How do I report a suspicious ad or seller?',
        answer: 'Click the "Report" button on any ad page or user profile. Select the reason for reporting and provide details. Our moderation team reviews all reports within 24 hours.',
      },
      {
        question: 'Can I negotiate the price?',
        answer: 'Yes, most sellers are open to negotiation. Use the messaging feature to discuss price and terms. If the ad shows "Price Negotiable", the seller has indicated they\'re open to offers.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Account & Profile',
    icon: '👤',
    description: 'Manage your account settings.',
    faqs: [
      {
        question: 'How do I verify my account?',
        answer: 'Go to your Profile Settings and look for the Verification section. You can verify your phone number, email, or apply for business verification. Verified accounts get a badge and appear more trustworthy to buyers.',
      },
      {
        question: 'How do I reset my password?',
        answer: 'Click "Sign In", then "Forgot Password". Enter your email address, and we\'ll send you a reset link. The link expires in 1 hour for security reasons.',
      },
      {
        question: 'How do I delete my account?',
        answer: 'Go to Profile Settings > Security > Delete Account. Note that this action is permanent and will remove all your ads and data. Contact support if you need to recover accidentally deleted accounts.',
      },
      {
        question: 'What is a Business Account?',
        answer: 'Business accounts are for registered businesses and dealers. They get additional features like a shop page, business verification badge, priority support, and bulk posting tools. Apply through your account settings.',
      },
    ],
  },
  {
    id: 'payments',
    title: 'Payments & Promotions',
    icon: '💳',
    description: 'Understand our payment and promotion options.',
    faqs: [
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept eSewa, Khalti, bank transfers, and other popular payment methods in Nepal. All payments are processed securely through our payment partners.',
      },
      {
        question: 'What are Featured Ads?',
        answer: 'Featured Ads appear at the top of search results and category pages with a special highlight. They get significantly more views and faster responses. Prices vary by category and duration.',
      },
      {
        question: 'How do Urgent and Sticky tags work?',
        answer: 'Urgent tags add a visible badge to your ad indicating time-sensitivity. Sticky posts keep your ad at the top of the category for the duration you choose. Both help your ad stand out from regular listings.',
      },
      {
        question: 'Can I get a refund for promotions?',
        answer: 'Refunds are available within 24 hours if your promoted ad hasn\'t been published yet. Once published, promotions are non-refundable. Contact support for special cases.',
      },
    ],
  },
  {
    id: 'safety',
    title: 'Safety & Security',
    icon: '🔒',
    description: 'Stay safe while buying and selling.',
    faqs: [
      {
        question: 'How can I stay safe when meeting buyers/sellers?',
        answer: 'Always meet in public places during daylight hours. Bring a friend if possible. Never share personal financial information. For expensive items, consider meeting at a police station or bank. Trust your instincts - if something feels wrong, walk away.',
      },
      {
        question: 'What should I do if I encounter fraud?',
        answer: 'Report the user immediately through our platform. If you\'ve lost money, file a police report. Contact our support team with all evidence (messages, transaction records). We take fraud seriously and will investigate promptly.',
      },
      {
        question: 'How does ThuluBazaar protect my data?',
        answer: 'We use industry-standard encryption and security practices. Your password is hashed and never stored in plain text. We don\'t share your personal information with third parties without consent. Read our Privacy Policy for full details.',
      },
      {
        question: 'Why do some users have verification badges?',
        answer: 'Verification badges indicate the user has verified their identity through our verification process. Blue checkmarks mean phone/email verified. Green badges indicate verified businesses. These badges help you identify trustworthy users.',
      },
    ],
  },
];

export default function HelpClient() {
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
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4">Help Center</h1>
          <p className="text-base sm:text-lg md:text-xl opacity-90 max-w-2xl mx-auto mb-6 md:mb-8">
            Find answers to your questions about ThuluBazaar
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for help..."
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 mb-6">
              We couldn&apos;t find any answers matching &quot;{searchQuery}&quot;
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setSearchQuery('')}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Search
              </button>
              <Link
                href="/contact"
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Contact Support
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
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 md:mb-4">Still Need Help?</h2>
          <p className="text-base sm:text-lg opacity-90 mb-6 md:mb-8 max-w-2xl mx-auto">
            Can&apos;t find what you&apos;re looking for? Our support team is here to help you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/support"
              className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Open Support Ticket
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

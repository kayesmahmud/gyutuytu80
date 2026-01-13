/**
 * FAQ Page
 * /[lang]/faq - Frequently Asked Questions
 */

import { Metadata } from 'next';
import FAQClient from './FAQClient';

export const metadata: Metadata = {
  title: 'FAQ | Thulo Bazaar',
  description: 'Frequently asked questions about Thulo Bazaar - buying, selling, payments, and more.',
};

export default function FAQPage() {
  return <FAQClient />;
}

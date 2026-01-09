/**
 * FAQ Page
 * /[lang]/faq - Frequently Asked Questions
 */

import { Metadata } from 'next';
import FAQClient from './FAQClient';

export const metadata: Metadata = {
  title: 'FAQ | ThuluBazaar',
  description: 'Frequently asked questions about ThuluBazaar - buying, selling, payments, and more.',
};

export default function FAQPage() {
  return <FAQClient />;
}

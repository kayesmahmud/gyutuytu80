/**
 * Contact Page
 * /[lang]/contact - Contact form and company information
 */

import { Metadata } from 'next';
import ContactClient from './ContactClient';

export const metadata: Metadata = {
  title: 'Contact Us | Thulo Bazaar',
  description: 'Get in touch with Thulo Bazaar. Contact us for support, partnerships, advertising, or general inquiries.',
};

export default function ContactPage() {
  return <ContactClient />;
}

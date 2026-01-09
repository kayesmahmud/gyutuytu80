/**
 * Contact Page
 * /[lang]/contact - Contact form and company information
 */

import { Metadata } from 'next';
import ContactClient from './ContactClient';

export const metadata: Metadata = {
  title: 'Contact Us | ThuluBazaar',
  description: 'Get in touch with ThuluBazaar. Contact us for support, partnerships, advertising, or general inquiries.',
};

export default function ContactPage() {
  return <ContactClient />;
}

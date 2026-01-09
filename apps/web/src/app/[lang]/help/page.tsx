/**
 * Help / FAQ Page
 * /[lang]/help - Frequently asked questions and help articles
 */

import { Metadata } from 'next';
import HelpClient from './HelpClient';

export const metadata: Metadata = {
  title: 'Help Center | ThuluBazaar',
  description: 'Find answers to frequently asked questions about buying, selling, account management, payments, and more on ThuluBazaar.',
};

export default function HelpPage() {
  return <HelpClient />;
}

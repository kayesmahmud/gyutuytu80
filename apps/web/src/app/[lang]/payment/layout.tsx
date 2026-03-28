import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Payment - Thulo Bazaar',
  robots: { index: false, follow: false },
};

export default function PaymentLayout({ children }: { children: React.ReactNode }) {
  return children;
}

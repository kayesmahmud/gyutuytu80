import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Verification - Thulo Bazaar',
  robots: { index: false, follow: false },
};

export default function VerificationLayout({ children }: { children: React.ReactNode }) {
  return children;
}

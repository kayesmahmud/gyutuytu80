import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Edit Ad - Thulo Bazaar',
  robots: { index: false, follow: false },
};

export default function EditAdLayout({ children }: { children: React.ReactNode }) {
  return children;
}

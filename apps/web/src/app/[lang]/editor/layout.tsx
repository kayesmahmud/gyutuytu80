import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Editor Panel - Thulo Bazaar',
  robots: { index: false, follow: false },
};

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return children;
}

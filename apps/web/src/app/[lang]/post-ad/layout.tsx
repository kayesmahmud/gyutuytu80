import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Post Ad - Thulo Bazaar',
  robots: { index: false, follow: false },
};

export default function PostAdLayout({ children }: { children: React.ReactNode }) {
  return children;
}

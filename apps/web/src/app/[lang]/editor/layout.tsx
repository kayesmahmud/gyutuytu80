import { Metadata } from 'next';
import { NativeFcmBridge } from '@/components/editor/NativeFcmBridge';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Editor Panel - Thulo Bazaar',
  robots: { index: false, follow: false },
};

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <NativeFcmBridge />
    </>
  );
}

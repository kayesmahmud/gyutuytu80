import { Metadata } from 'next';

/**
 * Auth routes must never be indexed.
 *
 * Without this, signin/signup/forgot-password/reset-password/oauth-success are
 * crawlable and inherit the homepage canonical from the root layout — and
 * reset-password carries a one-time token in its query string.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

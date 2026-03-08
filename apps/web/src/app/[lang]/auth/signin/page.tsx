import { Metadata } from 'next';
import Link from 'next/link';
import LoginForm from './LoginForm';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export async function generateMetadata({ params }: LoginPageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'metadata' });
  return {
    title: t('signinTitle'),
    description: t('signinDescription'),
  };
}

interface LoginPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const { lang } = await params;
  setRequestLocale(lang);
  const t = await getTranslations('auth');
  const resolvedSearchParams = await searchParams;
  const callbackUrl = typeof resolvedSearchParams.callbackUrl === 'string' ? resolvedSearchParams.callbackUrl : undefined;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <Link href={`/${lang}`} className="inline-block mb-4 sm:mb-6">
            <span className="text-3xl sm:text-4xl font-bold text-rose-500">Thulo Bazaar</span>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t('welcomeBack')}</h2>
          <p className="text-gray-500 text-sm sm:text-base">{t('loginSubtitle')}</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-md p-4 sm:p-6 md:p-8">
          <LoginForm lang={lang} />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-500">{t('dontHaveAccount')}</span>
            </div>
          </div>

          {/* Register Link */}
          <Link
            href={`/${lang}/auth/signup${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`}
            className="block w-full py-3 px-4 text-center rounded-lg font-semibold border-2 border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors duration-200"
          >
            {t('createAccount')}
          </Link>
        </div>

        {/* Footer Links */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <Link href={`/${lang}`} className="text-rose-500 hover:text-rose-600 transition-colors">
            {t('backToHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}

import { Metadata } from 'next';
import Link from 'next/link';
import RegisterForm from './RegisterForm';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export async function generateMetadata({ params }: RegisterPageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'metadata' });
  return {
    title: t('signupTitle'),
    description: t('signupDescription'),
  };
}

interface RegisterPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RegisterPage({ params, searchParams }: RegisterPageProps) {
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
            <h1 className="text-3xl sm:text-4xl font-bold text-rose-500">Thulo Bazaar</h1>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t('createAccount')}</h2>
          <p className="text-gray-500 text-sm sm:text-base">{t('joinThuloBazaar')}</p>
        </div>

        {/* Register Form Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4 sm:p-6">
          <RegisterForm lang={lang} />

          {/* Terms Agreement */}
          <p className="text-center text-xs text-gray-500 mt-4">
            {t('bySigningUp')}{' '}
            <Link
              href={`/${lang}/support/terms-of-service`}
              className="text-rose-500 hover:text-rose-600 underline"
            >
              {t('termsAndConditions')}
            </Link>
          </p>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">{t('alreadyHaveAccount')}</span>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <Link
              href={`/${lang}/auth/signin${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`}
              className="inline-block w-full px-4 py-2 rounded-lg font-semibold border-2 border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"
            >
              {t('signInInstead')}
            </Link>
          </div>
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

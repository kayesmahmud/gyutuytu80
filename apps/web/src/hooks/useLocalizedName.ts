import { useLocale } from 'next-intl';

export function useLocalizedName() {
  const locale = useLocale();
  return (name: string, nameNe?: string | null) =>
    locale === 'ne' && nameNe ? nameNe : name;
}

import Link from 'next/link';

interface MarketplaceCTAProps {
  categorySlugs: string[];
  lang: string;
}

const categoryLabels: Record<string, { en: string; ne: string }> = {
  'vehicles': { en: 'Vehicles', ne: 'सवारी साधन' },
  'cars': { en: 'Cars', ne: 'कार' },
  'motorcycles': { en: 'Motorcycles', ne: 'मोटरसाइकल' },
  'scooters': { en: 'Scooters', ne: 'स्कुटर' },
  'electronics': { en: 'Electronics', ne: 'इलेक्ट्रोनिक्स' },
  'mobile-phones': { en: 'Mobile Phones', ne: 'मोबाइल फोन' },
  'laptops': { en: 'Laptops', ne: 'ल्यापटप' },
  'property': { en: 'Property', ne: 'सम्पत्ति' },
  'fashion': { en: 'Fashion', ne: 'फेसन' },
  'pets': { en: 'Pets & Animals', ne: 'पाल्तु जनावर' },
  'services': { en: 'Services', ne: 'सेवाहरू' },
};

export default function MarketplaceCTA({ categorySlugs, lang }: MarketplaceCTAProps) {
  if (!categorySlugs || categorySlugs.length === 0) return null;

  const isNe = lang === 'ne';

  return (
    <div className="bg-gradient-to-r from-rose-50 to-orange-50 rounded-xl p-5 sm:p-6 border border-rose-100 my-8">
      <h3 className="font-bold text-gray-900 mb-1">
        {isNe ? 'Thulo Bazaar मा हेर्नुहोस्' : 'Browse on Thulo Bazaar'}
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        {isNe
          ? 'नेपालको सबैभन्दा ठूलो क्लासिफाइड मार्केटप्लेसमा किन्नुहोस् र बेच्नुहोस्'
          : "Buy and sell on Nepal's largest classifieds marketplace"}
      </p>
      <div className="flex flex-wrap gap-2">
        {categorySlugs.map(slug => {
          const label = categoryLabels[slug];
          const displayName = label ? (isNe ? label.ne : label.en) : slug;
          return (
            <Link
              key={slug}
              href={`/${lang}/ads/${slug}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors"
            >
              {isNe ? `${displayName} हेर्नुहोस्` : `Browse ${displayName}`}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

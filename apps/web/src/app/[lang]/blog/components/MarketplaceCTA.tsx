import Link from 'next/link';

interface MarketplaceCTAProps {
  categorySlugs: string[];
  lang: string;
}

const categoryLabels: Record<string, { en: string; ne: string }> = {
  // Vehicles
  'vehicles': { en: 'Vehicles', ne: 'सवारी साधन' },
  'cars': { en: 'Cars', ne: 'कार' },
  'motorcycles': { en: 'Motorcycles', ne: 'मोटरसाइकल' },
  'scooters': { en: 'Scooters', ne: 'स्कुटर' },
  // Electronics
  'electronics': { en: 'Electronics', ne: 'इलेक्ट्रोनिक्स' },
  'mobile-phones': { en: 'Mobile Phones', ne: 'मोबाइल फोन' },
  'laptops': { en: 'Laptops', ne: 'ल्यापटप' },
  // Property
  'property': { en: 'Property', ne: 'सम्पत्ति' },
  'land-for-sale': { en: 'Land for Sale', ne: 'बिक्री जग्गा' },
  'houses-for-sale': { en: 'Houses for Sale', ne: 'बिक्री घर' },
  'commercial-property': { en: 'Commercial Property', ne: 'व्यापारिक सम्पत्ति' },
  'apartment-rentals': { en: 'Apartment Rentals', ne: 'अपार्टमेन्ट भाडा' },
  'house-rentals': { en: 'House Rentals', ne: 'घर भाडा' },
  // Fashion
  'fashion': { en: 'Fashion', ne: 'फेसन' },
  'mens-clothing': { en: "Men's Clothing", ne: 'पुरुष लुगा' },
  'womens-clothing': { en: "Women's Clothing", ne: 'महिला लुगा' },
  'mens-grooming': { en: "Men's Grooming", ne: 'पुरुष ग्रुमिङ' },
  'womens-accessories': { en: "Women's Accessories", ne: 'महिला एक्सेसरीज' },
  'beauty-products': { en: 'Beauty Products', ne: 'सौन्दर्य सामान' },
  'jewelry': { en: 'Jewelry', ne: 'गहना' },
  // Pets & Animals
  'pets': { en: 'Pets & Animals', ne: 'पाल्तु जनावर' },
  'dogs': { en: 'Dogs', ne: 'कुकुर' },
  'cats': { en: 'Cats', ne: 'बिरालो' },
  'birds': { en: 'Birds', ne: 'चरा' },
  'fish-aquariums': { en: 'Fish & Aquariums', ne: 'माछा र एक्वेरियम' },
  'livestock': { en: 'Livestock', ne: 'पशुधन' },
  'other-pets': { en: 'Other Pets', ne: 'अन्य पाल्तु जनावर' },
  // Services
  'services': { en: 'Services', ne: 'सेवाहरू' },
  'tuition-classes': { en: 'Tuition & Classes', ne: 'ट्युसन र कक्षा' },
  'repair-services': { en: 'Repair Services', ne: 'मर्मत सेवा' },
  'it-services': { en: 'IT Services', ne: 'IT सेवा' },
  'gym-fitness': { en: 'Gym & Fitness', ne: 'जिम र फिटनेस' },
  'beauty-services': { en: 'Beauty Services', ne: 'ब्यूटी सेवा' },
  'domestic-services': { en: 'Domestic Services', ne: 'घरेलु सेवा' },
  // Jobs
  'jobs': { en: 'Jobs', ne: 'रोजगार' },
  'overseas-jobs': { en: 'Overseas Jobs', ne: 'विदेशी रोजगार' },
  // Home & Living
  'furniture': { en: 'Furniture', ne: 'फर्निचर' },
  'home-textiles': { en: 'Home Textiles', ne: 'घरेलु कपडा' },
  'home-appliances': { en: 'Home Appliances', ne: 'घरेलु उपकरण' },
  'home-decor': { en: 'Home Décor', ne: 'गृह सजावट' },
  'kitchen-appliances': { en: 'Kitchen Appliances', ne: 'भान्सा उपकरण' },
  'household-items': { en: 'Household Items', ne: 'घरेलु सामान' },
  // Hobbies, Sports & Kids
  'musical-instruments': { en: 'Musical Instruments', ne: 'वाद्ययन्त्र' },
  'sports-equipment': { en: 'Sports Equipment', ne: 'खेलकुद सामान' },
  'books': { en: 'Books', ne: 'किताब' },
  'kids-items': { en: 'Kids Items', ne: 'बच्चाका सामान' },
  // Business & Industry
  'machinery': { en: 'Machinery', ne: 'मेसिनरी' },
  'medical-equipment': { en: 'Medical Equipment', ne: 'मेडिकल उपकरण' },
  'office-equipment': { en: 'Office Equipment', ne: 'अफिस उपकरण' },
  'raw-materials': { en: 'Raw Materials', ne: 'कच्चा पदार्थ' },
  'licenses': { en: 'Licenses & Permits', ne: 'इजाजतपत्र' },
  // Agriculture
  'farming-tools': { en: 'Farming Tools', ne: 'कृषि उपकरण' },
  'fertilizers': { en: 'Fertilizers', ne: 'मल' },
  'crops': { en: 'Crops & Seeds', ne: 'बाली र बीउ' },
  'livestock-feed': { en: 'Livestock Feed', ne: 'पशु दाना' },
  // Essentials
  'baby-products': { en: 'Baby Products', ne: 'शिशु सामान' },
  'healthcare': { en: 'Healthcare', ne: 'स्वास्थ्य सेवा' },
  'grocery': { en: 'Grocery', ne: 'किराना' },
  'household': { en: 'Household', ne: 'घरेलु सामान' },
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

import { prisma } from '../src/client';

const UNSPLASH_BASE = 'https://images.unsplash.com/photo-';
const PARAMS = '?w=800&h=450&fit=crop&q=80';
function img(id: string) { return `${UNSPLASH_BASE}${id}${PARAMS}`; }

// Correct slugs from DB → [photoId, altEn, altNe]
const postImages: Record<string, [string, string, string]> = {
  // ── AGRICULTURE ──
  'dairy-farming-nepal-equipment-feed-guide': ['1563720223185-11003d516935', 'Dairy farm with cows', 'गाईहरूसहित डेरी फार्म'],
  'poultry-farming-nepal-setup-cost-returns': ['1548550023-2bdb3c5e3670', 'Poultry farm with chickens', 'कुखुराहरूसहित पोल्ट्री फार्म'],
  'sell-crops-online-nepal-farmers-guide': ['1500382017468-9049fed747ef', 'Fresh vegetables and crops', 'ताजा तरकारी र बालीहरू'],
  'mini-tiller-price-nepal-best-models': ['1590682680695-43b964a3ae17', 'Mini tiller machine in field', 'खेतमा मिनी टिलर मेसिन'],

  // ── BUSINESS & INDUSTRY ──
  'restaurant-equipment-nepal': ['1556909114-f6e7ad7d3136', 'Restaurant kitchen equipment', 'रेस्टुरेन्ट भान्सा उपकरण'],
  'medical-equipment-nepal-used': ['1579684385127-1ef15d508118', 'Medical equipment in hospital', 'अस्पतालमा मेडिकल उपकरण'],
  'industrial-machinery-nepal-guide': ['1581091226825-a6a306ee0cd7', 'Industrial machinery in factory', 'कारखानामा औद्योगिक मेसिनरी'],
  'business-license-nepal-guide': ['1450101499163-c8848e968838', 'Business documents and registration', 'व्यापारिक कागजात र दर्ता'],

  // ── ELECTRONICS ──
  'ups-inverter-nepal-buying-guide-home': ['1621905252507-b35492cc74b4', 'UPS and inverter for home', 'घरका लागि UPS र इन्भर्टर'],
  'best-printers-home-office-nepal': ['1612815154858-60aa4c59eaa6', 'Printer in home office', 'गृह कार्यालयमा प्रिन्टर'],
  'router-wifi-setup-nepal-best-options': ['1544197150-b99a580ef48a', 'WiFi router setup at home', 'घरमा WiFi राउटर सेटअप'],
  'cctv-camera-nepal-home-security-setup': ['1557597774-9d273605dfa9', 'CCTV security camera installed', 'जडान गरिएको CCTV सुरक्षा क्यामेरा'],

  // ── ESSENTIALS ──
  'baby-formula-feeding-nepal-safety-guide': ['1515488042361-ee00e0ddd4e4', 'Baby feeding supplies', 'शिशु खुवाउने सामानहरू'],
  'household-cleaning-products-nepal-top': ['1563453392212-326f5e854473', 'Household cleaning supplies', 'घरेलु सफाई सामानहरू'],
  'grocery-delivery-services-nepal-compared': ['1543168256-418811576931', 'Grocery delivery bags', 'किराना डेलिभरी झोलाहरू'],

  // ── FASHION ──
  'womens-handbags-nepal': ['1548036328-c11839ce7b4f', 'Collection of women\'s handbags', 'महिला ह्यान्डब्यागहरूको सङ्ग्रह'],
  'affordable-skincare-nepal': ['1556228578-8c89e6adf883', 'Skincare products arranged neatly', 'राम्ररी मिलाइएका छाला हेरचाह सामानहरू'],
  'ethnic-vs-western-wear-nepal': ['1509631179647-0177331693ae', 'Ethnic and western clothing comparison', 'जातीय र पश्चिमी लुगाको तुलना'],
  'buy-saree-online-nepal-2026': ['1610189322879-15d5e8e5a910', 'Colorful sarees displayed in shop', 'पसलमा रङ्गीन साडीहरू प्रदर्शनमा'],
  'leather-jackets-nepal-2026': ['1551028719-0220a51e27a7', 'Leather jacket on wooden hanger', 'काठको ह्याङ्गरमा छाला ज्याकेट'],
  'sell-used-clothes-online-nepal': ['1558618666-fcd25c85f82e', 'Used clothes sorted for online sale', 'अनलाइन बिक्रीका लागि छुट्टाइएका पुराना कपडाहरू'],
  'second-hand-suits-kathmandu': ['1507003211169-0a1dd7228f2d', 'Men\'s suits on display in Kathmandu store', 'काठमाडौं पसलमा पुरुष सुटहरू प्रदर्शनमा'],
  'bridal-lehenga-kathmandu-2026': ['1595777457583-95e3f025c7b0', 'Beautiful bridal lehenga in red', 'सुन्दर रातो दुलही लेहेंगा'],

  // ── HOBBIES & SPORTS ──
  'best-kids-toys-nepal-age-wise-guide': ['1596461404969-9ae70134dc53', 'Colorful children\'s toys', 'रङ्गीन बच्चाका खेलौनाहरू'],
  'best-guitars-under-15000-nepal-beginners': ['1510915361894-db8b60106cb1', 'Acoustic guitar on wooden floor', 'काठको भुइँमा एकुस्टिक गिटार'],
  'cricket-equipment-nepal-bats-pads-guide': ['1531415074968-036ba1b575da', 'Cricket bat and equipment', 'क्रिकेट ब्याट र सामान'],
  'trekking-gear-nepal-buy-rent-guide': ['1464822759023-fed784a4a1e7', 'Trekking gear and backpack', 'ट्रेकिङ सामान र ब्याकप्याक'],
  'buy-used-books-kathmandu-shops-online': ['1507842217343-583bb7270b66', 'Stack of used books', 'पुराना किताबको थाक'],
  'baby-stroller-car-seat-nepal-buyer-tips': ['1544776193-352d25ca82cd', 'Baby stroller in park', 'पार्कमा बेबी स्ट्रोलर'],
  'fitness-equipment-home-gym-nepal': ['1534438327276-14e5300c3a48', 'Home gym fitness equipment', 'घरेलु जिम फिटनेस उपकरण'],
  'tabla-madal-price-nepal-instrument-guide': ['1519892300165-cb5542fb47c7', 'Traditional Nepali musical instruments', 'परम्परागत नेपाली वाद्ययन्त्र'],

  // ── HOME & LIVING ──
  'buy-dining-table-nepal-wood-types-prices': ['1617806118233-18e1de247200', 'Wooden dining table set', 'काठको खाजा टेबुल सेट'],
  'led-lights-fixtures-nepal-buyers-guide': ['1565814329405-e612c70e5cf4', 'Modern LED light fixtures', 'आधुनिक LED बत्ती फिक्चर'],
  'best-water-purifiers-nepal-ro-vs-uv': ['1564419320461-6de1ba34fa98', 'Water purifier installed in kitchen', 'भान्सामा जडान गरिएको पानी शुद्धिकरण'],
  'curtain-blinds-buying-guide-nepal': ['1513694203232-719a280e022f', 'Window with elegant curtains', 'सुन्दर पर्दाहरूसहित झ्याल'],

  // ── JOBS ──
  'teaching-jobs-nepal-2026-salary-apply': ['1509062522246-3755977927d7', 'Teacher in classroom with students', 'विद्यार्थीहरूसहित कक्षाकोठामा शिक्षक'],
  'korea-eps-job-application-nepal-guide': ['1534274867514-d5b47ef89ed7', 'Seoul cityscape in South Korea', 'दक्षिण कोरियामा सियोल शहर दृश्य'],
  'start-small-business-nepal-guide': ['1460925895917-afdab827c52f', 'Small business shop in Nepal', 'नेपालमा सानो व्यापार पसल'],

  // ── MOBILES ──
  '5g-phones-nepal-network-device-guide': ['1512941937-1a5b9f1d8a6c', '5G phone with fast network', '5G फोनसहित छिटो नेटवर्क'],
  'best-gaming-phones-nepal-top-10': ['1592899677977-9c10ca588bbd', 'Gaming phone with game display', 'गेम डिस्प्लेसहित गेमिङ फोन'],
  'mobile-insurance-nepal-worth-it-guide': ['1556656195-b8de6024db38', 'Smartphone with insurance concept', 'बीमा अवधारणासहित स्मार्टफोन'],

  // ── PETS ──
  'livestock-goat-farming-nepal-tips': ['1516467508483-ceee80e0f8a0', 'Goats grazing in Nepal hills', 'नेपालको पहाडमा बाख्रा चर्दै'],
  'pet-vaccination-schedule-nepal-complete': ['1612349317150-e413f6a5b8d7', 'Veterinarian examining a pet', 'पशु चिकित्सकले पाल्तु जनावर जाँच गर्दै'],
  'buy-aquarium-fish-kathmandu-guide': ['1520301255168-a495c78f9927', 'Colorful tropical fish in aquarium', 'एक्वेरियममा रङ्गीन ट्रपिकल माछा'],
  'best-dog-breeds-nepal-climate-homes': ['1587300003388-59208cc962cb', 'Happy dog outdoors in Nepal', 'नेपालमा बाहिर खुसी कुकुर'],
  'bird-keeping-nepal-species-cage-guide': ['1552728089-57bdde30beb3', 'Parakeet in cage with food', 'खानासहित पिंजडामा प्याराकिट'],

  // ── PROPERTY ──
  'chitwan-real-estate-land-house-prices': ['1564013799919-ab11e02e1f6f', 'Land and houses in Chitwan', 'चितवनमा जग्गा र घरहरू'],
  'home-loan-nepal-banks-rates-emi-guide': ['1560520653-9e0e4c89eb11', 'Bank building in Nepal', 'नेपालमा बैंक भवन'],
  'property-registration-nepal-rajaswa-process': ['1450101499163-c8848e968838', 'Property registration office', 'सम्पत्ति दर्ता कार्यालय'],
  'office-space-rent-kathmandu-prices-area': ['1497366216548-37526070297c', 'Office space for rent', 'भाडामा अफिस स्पेस'],
  'property-tax-nepal-rates-how-to-pay': ['1560518883-ce09cec164e6', 'Property documents and tax papers', 'सम्पत्ति कागजात र कर कागजपत्र'],

  // ── SERVICES ──
  'find-domestic-help-nepal-maid-cook': ['1581578536294-4439a6a0b43e', 'Clean modern kitchen interior', 'सफा आधुनिक भान्सा भित्री दृश्य'],
  'home-repair-services-nepal-plumber-guide': ['1581578731548-c64695cc6952', 'Plumber fixing pipes at home', 'घरमा प्लम्बरले पाइप मर्मत गर्दै'],
  'hire-it-freelancers-nepal-guide': ['1498050108023-c5249f4df085', 'Freelancer working on laptop', 'ल्यापटपमा काम गर्दै फ्रिल्यान्सर'],
  'beauty-salon-prices-kathmandu-2026': ['1560066984-138dadb4c035', 'Beauty salon interior', 'ब्यूटी सलुन भित्री दृश्य'],

  // ── VEHICLES ──
  'car-modification-laws-nepal-whats-legal': ['1492144534655-ae79c964c9d7', 'Modified car in garage', 'ग्यारेजमा परिमार्जित कार'],
  'two-wheeler-loan-nepal-interest-documents': ['1558980394-0a06c4631733', 'Motorcycle in showroom', 'शोरुममा मोटरसाइकल'],
  'used-car-prices-nepal-market-trends': ['1549317661-bd1f6f84c44c', 'Used cars in Nepal market', 'नेपाल बजारमा पुराना कारहरू'],
  'sell-car-fast-nepal-proven-tips': ['1542362567-b07ad36615b8', 'Car for sale with sign', 'बिक्रीको साइनसहित कार'],
};

async function main() {
  console.log('Fixing missing featured images (round 2)...\n');
  let updated = 0;
  let notFound = 0;

  for (const [slug, [photoId, altEn, altNe]] of Object.entries(postImages)) {
    const post = await prisma.blog_posts.findUnique({ where: { slug } });
    if (!post) { console.log(`  ❌ Not found: ${slug}`); notFound++; continue; }
    if (post.featured_image) { continue; }

    await prisma.blog_posts.update({
      where: { slug },
      data: {
        featured_image: img(photoId),
        featured_image_alt: altEn,
        featured_image_alt_ne: altNe,
      },
    });
    updated++;
  }

  console.log(`\n✅ Updated ${updated} posts`);
  if (notFound) console.log(`⚠️  ${notFound} not found`);
  const still = await prisma.blog_posts.count({ where: { featured_image: null } });
  console.log(`📊 Still missing images: ${still}`);
}

main()
  .catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());

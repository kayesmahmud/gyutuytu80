import { prisma } from '../src/client';

/**
 * Adds featured images (Unsplash) to blog posts that don't have one.
 * Uses curated Unsplash photo IDs matched to post topics.
 */

const UNSPLASH_BASE = 'https://images.unsplash.com/photo-';
const PARAMS = '?w=800&h=450&fit=crop&q=80';

function img(id: string) {
  return `${UNSPLASH_BASE}${id}${PARAMS}`;
}

// Map: post slug → [unsplash photo ID, alt text EN, alt text NE]
const postImages: Record<string, [string, string, string]> = {
  // ── FASHION (15) ──
  'best-mens-kurta-suruwal-nepal-2026': ['1610030469983-6f4116a0e353', 'Nepali man wearing traditional kurta suruwal', 'नेपाली पुरुष परम्परागत कुर्ता सुरुवाल लगाएको'],
  'buy-second-hand-suits-kathmandu': ['1507003211169-0a1dd7228f2d', 'Men\'s suits on display in Kathmandu store', 'काठमाडौं पसलमा पुरुष सुटहरू प्रदर्शनमा'],
  'mens-grooming-products-nepal': ['1585751119414-ef2636f8aede', 'Men\'s grooming products and accessories', 'पुरुष ग्रुमिङ सामान र एक्सेसरीज'],
  'how-to-sell-used-clothes-online-nepal': ['1558618666-fcd25c85f82e', 'Used clothes sorted for online sale', 'अनलाइन बिक्रीका लागि छुट्टाइएका पुराना कपडाहरू'],
  'best-leather-jackets-nepal-winters-2026': ['1551028719-0220a51e27a7', 'Leather jacket on wooden hanger', 'काठको ह्याङ्गरमा छाला ज्याकेट'],
  'buy-saree-online-nepal-guide-2026': ['1610189322879-15d5e8e5a910', 'Colorful sarees displayed in shop', 'पसलमा रङ्गीन साडीहरू प्रदर्शनमा'],
  'best-bridal-lehenga-shops-kathmandu-2026': ['1595777457583-95e3f025c7b0', 'Beautiful bridal lehenga in red', 'सुन्दर रातो दुलही लेहेंगा'],
  'affordable-skincare-products-nepal': ['1556228578-8c89e6adf883', 'Skincare products arranged neatly', 'राम्ररी मिलाइएका छाला हेरचाह सामानहरू'],
  'gold-vs-artificial-jewelry-nepal': ['1515562141-62a4ff5ef3f3', 'Gold and artificial jewelry comparison', 'सुन र कृत्रिम गहनाको तुलना'],
  'womens-handbags-nepal-budget-premium': ['1548036328-c11839ce7b4f', 'Collection of women\'s handbags', 'महिला ह्यान्डब्यागहरूको सङ्ग्रह'],
  'best-makeup-brands-nepal-2026': ['1596462502025-75eb0b105b5c', 'Makeup products and brushes', 'मेकअप सामान र ब्रशहरू'],
  'sell-pre-loved-designer-clothes-nepal': ['1567401893414-76b7b1e5a7a5', 'Pre-loved designer clothes on rack', 'र्‍याकमा प्रि-लभ्ड डिजाइनर कपडाहरू'],
  'kurti-styles-trending-nepal-2026': ['1583391733956-3750e0ff4e8b', 'Trendy kurti designs collection', 'ट्रेन्डी कुर्ती डिजाइन सङ्ग्रह'],
  'best-hair-care-products-nepal': ['1522337360788-8b13dee7a37e', 'Hair care products and tools', 'कपाल हेरचाह सामान र उपकरणहरू'],
  'ethnic-vs-western-wear-nepal-style': ['1509631179647-0177331693ae', 'Ethnic and western clothing comparison', 'जातीय र पश्चिमी लुगाको तुलना'],

  // ── PETS (10) ──
  'best-dog-breeds-nepal-climate': ['1587300003388-59208cc962cb', 'Happy dog outdoors in Nepal', 'नेपालमा बाहिर खुसी कुकुर'],
  'cat-care-guide-nepal-breeds-costs': ['1514888286974-6c03e2ca1dba', 'Cat being petted at home', 'घरमा कुचो गरिएको बिरालो'],
  'aquarium-fish-kathmandu-2026': ['1520301255168-a495c78f9927', 'Colorful tropical fish in aquarium', 'एक्वेरियममा रङ्गीन ट्रपिकल माछा'],
  'pet-vaccination-schedule-nepal': ['1612349317150-e413f6a5b8d7', 'Veterinarian examining a pet', 'पशु चिकित्सकले पाल्तु जनावर जाँच गर्दै'],
  'bird-keeping-nepal-species-cage': ['1552728089-57bdde30beb3', 'Parakeet in cage with food', 'खानासहित पिंजडामा प्याराकिट'],
  'adopt-stray-dog-nepal-legally': ['1601758228041-f3b2795255b1', 'Stray dog being rescued', 'उद्धार गरिएको खोर कुकुर'],
  'livestock-sale-nepal-goat-farming': ['1516467508483-ceee80e0f8a0', 'Goats grazing in Nepal hills', 'नेपालको पहाडमा बाख्रा चर्दै'],
  'pet-grooming-services-kathmandu': ['1516734212186-65266e025f97', 'Dog getting groomed at salon', 'सलुनमा कुकुरको ग्रुमिङ हुँदै'],
  'best-pet-shops-kathmandu-2026': ['1597633125184-67db65e7e9c0', 'Pet shop interior with supplies', 'सामानसहित पेट शप भित्री दृश्य'],
  'rabbit-hamster-care-nepal-beginners': ['1535241749838-299277b6305f', 'Cute rabbit in home enclosure', 'घरको बाडामा प्यारो खरायो'],

  // ── SERVICES (6) ──
  'find-best-tuition-teachers-kathmandu': ['1523050854058-8df90110c9f1', 'Teacher tutoring student in classroom', 'कक्षाकोठामा शिक्षकले विद्यार्थीलाई पढाउँदै'],
  'home-repair-services-nepal-plumber': ['1581578731548-c64695cc6952', 'Plumber fixing pipes at home', 'घरमा प्लम्बरले पाइप मर्मत गर्दै'],
  'hire-it-freelancers-nepal': ['1498050108023-c5249f4df085', 'Freelancer working on laptop', 'ल्यापटपमा काम गर्दै फ्रिल्यान्सर'],
  'best-gym-fitness-centers-kathmandu-2026': ['1534438327276-14e5300c3a48', 'Modern gym with equipment', 'उपकरणसहित आधुनिक जिम'],
  'beauty-salon-prices-kathmandu-guide': ['1560066984-138dadb4c035', 'Beauty salon interior', 'ब्यूटी सलुन भित्री दृश्य'],
  'find-domestic-help-nepal-guide': ['1581578536294-4439a6a0b43e', 'Clean modern kitchen interior', 'सफा आधुनिक भान्सा भित्री दृश्य'],

  // ── JOBS (6) ──
  'work-from-home-jobs-nepal-2026': ['1521898284481-a5ec348cb555', 'Person working from home on computer', 'घरमा कम्प्युटरमा काम गर्दै'],
  'part-time-jobs-students-kathmandu-2026': ['1523240795612-9a054b0db644', 'Young student at part-time job', 'पार्ट-टाइम जागिरमा युवा विद्यार्थी'],
  'overseas-jobs-dubai-nepali-workers': ['1512453913974-a3dd121869a4', 'Dubai skyline with modern buildings', 'आधुनिक भवनहरूसहित दुबई स्काइलाइन'],
  'korea-eps-job-application-nepal': ['1534274867514-d5b47ef89ed7', 'Seoul cityscape in South Korea', 'दक्षिण कोरियामा सियोल शहर दृश्य'],
  'start-small-business-nepal': ['1460925895917-afdab827c52f', 'Small business shop in Nepal', 'नेपालमा सानो व्यापार पसल'],
  'teaching-jobs-nepal-2026': ['1509062522246-3755977927d7', 'Teacher in classroom with students', 'विद्यार्थीहरूसहित कक्षाकोठामा शिक्षक'],

  // ── HOME & LIVING (10) ──
  'best-sofa-sets-nepal-under-50000': ['1555041469-a586c61ea9bc', 'Modern sofa set in living room', 'बैठक कोठामा आधुनिक सोफा सेट'],
  'buy-dining-table-nepal-wood-types': ['1617806118233-18e1de247200', 'Wooden dining table set', 'काठको खाजा टेबुल सेट'],
  'curtain-blinds-buying-guide-nepal-2026': ['1513694203232-719a280e022f', 'Window with elegant curtains', 'सुन्दर पर्दाहरूसहित झ्याल'],
  'best-water-purifiers-nepal-2026': ['1564419320461-6de1ba34fa98', 'Water purifier installed in kitchen', 'भान्सामा जडान गरिएको पानी शुद्धिकरण'],
  'led-lights-fixtures-nepal-guide': ['1565814329405-e612c70e5cf4', 'Modern LED light fixtures', 'आधुनिक LED बत्ती फिक्चर'],
  'mattress-buying-guide-nepal-foam-spring': ['1631049307264-da0ec9d70304', 'Comfortable mattress in bedroom', 'शयनकक्षमा आरामदायी गद्दा'],
  'best-induction-cooktops-nepal-under-10000': ['1556909114-f6e7ad7d3136', 'Induction cooktop in modern kitchen', 'आधुनिक भान्सामा इन्डक्शन कुकटप'],
  'wardrobe-storage-solutions-nepal': ['1558618666-fcd25c85f82e', 'Organized wardrobe with shelves', 'शेल्फहरूसहित व्यवस्थित अलमारी'],
  'second-hand-furniture-kathmandu-buy-sell': ['1524758631624-e2822e304c36', 'Second-hand furniture market', 'सेकेन्ड-ह्यान्ड फर्निचर बजार'],
  'bathroom-fittings-nepal-brands-prices': ['1552321554-5fefe8c9ef14', 'Modern bathroom fixtures', 'आधुनिक बाथरुम फिक्चर'],

  // ── HOBBIES & SPORTS (8) ──
  'best-guitars-nepal-under-15000': ['1510915361894-db8b60106cb1', 'Acoustic guitar on wooden floor', 'काठको भुइँमा एकुस्टिक गिटार'],
  'cricket-equipment-nepal-bats-pads': ['1531415074968-036ba1b575da', 'Cricket bat and equipment', 'क्रिकेट ब्याट र सामान'],
  'trekking-gear-nepal-buy-rent-2026': ['1464822759023-fed784a4a1e7', 'Trekking gear and backpack', 'ट्रेकिङ सामान र ब्याकप्याक'],
  'buy-used-books-kathmandu-shops': ['1507842217343-583bb7270b66', 'Stack of used books', 'पुराना किताबको थाक'],
  'best-kids-toys-nepal-age-guide-2026': ['1596461404969-9ae70134dc53', 'Colorful children\'s toys', 'रङ्गीन बच्चाका खेलौनाहरू'],
  'baby-stroller-car-seat-nepal': ['1544776193-352d25ca82cd', 'Baby stroller in park', 'पार्कमा बेबी स्ट्रोलर'],
  'fitness-equipment-home-gym-nepal-2026': ['1534438327276-14e5300c3a48', 'Home gym fitness equipment', 'घरेलु जिम फिटनेस उपकरण'],
  'tabla-madal-price-nepal-instrument': ['1519892300165-cb5542fb47c7', 'Traditional Nepali musical instruments', 'परम्परागत नेपाली वाद्ययन्त्र'],

  // ── BUSINESS & INDUSTRY (8) ──
  'buy-industrial-machinery-nepal-guide': ['1581091226825-a6a306ee0cd7', 'Industrial machinery in factory', 'कारखानामा औद्योगिक मेसिनरी'],
  'medical-equipment-nepal-where-buy-used': ['1579684385127-1ef15d508118', 'Medical equipment in hospital', 'अस्पतालमा मेडिकल उपकरण'],
  'office-furniture-kathmandu-2026': ['1497366216548-37526070297c', 'Modern office furniture setup', 'आधुनिक अफिस फर्निचर सेटअप'],
  'raw-materials-suppliers-nepal': ['1504917595217-d4dc5ede32ce', 'Raw materials in warehouse', 'गोदाममा कच्चा पदार्थ'],
  'buy-transfer-business-license-nepal': ['1450101499163-c8848e968838', 'Business documents and registration', 'व्यापारिक कागजात र दर्ता'],
  'restaurant-equipment-nepal-startup': ['1556909114-f6e7ad7d3136', 'Restaurant kitchen equipment', 'रेस्टुरेन्ट भान्सा उपकरण'],
  'printing-packaging-machinery-nepal': ['1504917595217-d4dc5ede32ce', 'Printing machinery in operation', 'सञ्चालनमा प्रिन्टिङ मेसिन'],
  'construction-equipment-rental-nepal': ['1504307651254-35680f356dfd', 'Construction equipment on site', 'साइटमा निर्माण उपकरण'],

  // ── AGRICULTURE (7) ──
  'best-farming-tools-nepal-manual-machine': ['1592982537447-6f17090e3646', 'Farming tools laid out', 'फैलाइएका कृषि उपकरणहरू'],
  'organic-fertilizer-nepal-brands-where-buy': ['1416879595882-3373a0480b5b', 'Organic compost and fertilizer', 'जैविक कम्पोस्ट र मल'],
  'poultry-farming-nepal-setup-cost': ['1548550023-2bdb3c5e3670', 'Poultry farm with chickens', 'कुखुराहरूसहित पोल्ट्री फार्म'],
  'sell-crops-online-nepal-2026': ['1500382017468-9049fed747ef', 'Fresh vegetables and crops', 'ताजा तरकारी र बालीहरू'],
  'mini-tiller-price-nepal-2026': ['1590682680695-43b964a3ae17', 'Mini tiller machine in field', 'खेतमा मिनी टिलर मेसिन'],
  'dairy-farming-nepal-equipment-feed': ['1563720223185-11003d516935', 'Dairy farm with cows', 'गाईहरूसहित डेरी फार्म'],
  'greenhouse-farming-nepal-setup-cost': ['1585320806297-9794b3e4eeae', 'Greenhouse interior with plants', 'बिरुवाहरूसहित ग्रिनहाउस भित्री दृश्य'],

  // ── ESSENTIALS (5) ──
  'best-baby-products-nepal-diapers-cribs': ['1522771930-78a95ab8b2ab', 'Baby products and accessories', 'शिशु सामान र एक्सेसरीज'],
  'healthcare-products-nepal-buy-online': ['1584308666744-24d5c9b2a8e1', 'Healthcare products display', 'स्वास्थ्य सामान प्रदर्शन'],
  'grocery-delivery-services-nepal': ['1543168256-418811576931', 'Grocery delivery bags', 'किराना डेलिभरी झोलाहरू'],
  'household-cleaning-products-nepal': ['1563453392212-326f5e854473', 'Household cleaning supplies', 'घरेलु सफाई सामानहरू'],
  'baby-formula-feeding-nepal-safety': ['1515488042361-ee00e0ddd4e4', 'Baby feeding supplies', 'शिशु खुवाउने सामानहरू'],

  // ── VEHICLES NEW (10) ──
  'used-car-prices-nepal-2026-market': ['1549317661-bd1f6f84c44c', 'Used cars in Nepal market', 'नेपाल बजारमा पुराना कारहरू'],
  'best-suvs-nepal-roads-top-10': ['1519641471654-76ce0107ad1b', 'SUV on mountain road in Nepal', 'नेपालको पहाडी बाटोमा SUV'],
  'two-wheeler-loan-nepal-interest': ['1558618666-fcd25c85f82e', 'Motorcycle in showroom', 'शोरुममा मोटरसाइकल'],
  'car-modification-laws-nepal-legal': ['1492144534655-ae79c964c9d7', 'Modified car in garage', 'ग्यारेजमा परिमार्जित कार'],
  'sell-your-car-fast-nepal-tips': ['1542362567-b07ad36615b8', 'Car for sale with sign', 'बिक्रीको साइनसहित कार'],
  'motorcycle-helmets-nepal-safety': ['1558618047-f4f33db83c9f', 'Motorcycle helmets on display', 'प्रदर्शनमा मोटरसाइकल हेल्मेटहरू'],
  'electric-bike-prices-nepal-2026': ['1571188654248-7a89013e5a64', 'Electric bike on street', 'सडकमा इलेक्ट्रिक बाइक'],
  'car-vs-motorbike-nepal-cost': ['1449965408869-eaa3f722e40d', 'Car and motorcycle side by side', 'एकैछिन कार र मोटरसाइकल'],
  'vehicle-pollution-test-nepal': ['1611739592245-1e0b5e13ae7d', 'Vehicle emission testing', 'सवारी साधन उत्सर्जन परीक्षण'],
  'best-family-cars-nepal-2026': ['1533473359331-2f64fd5b36a8', 'Family sedan on Nepal road', 'नेपालको बाटोमा पारिवारिक सेडान'],

  // ── ELECTRONICS NEW (5) ──
  'best-projectors-home-nepal-under-30000': ['1478720568477-152d9b164e07', 'Home projector setup', 'घरेलु प्रोजेक्टर सेटअप'],
  'ups-inverter-nepal-buying-guide': ['1558618666-fcd25c85f82e', 'UPS and inverter for home', 'घरका लागि UPS र इन्भर्टर'],
  'cctv-camera-nepal-home-security': ['1557597774-9d273605dfa9', 'CCTV security camera installed', 'जडान गरिएको CCTV सुरक्षा क्यामेरा'],
  'best-printers-home-office-nepal-2026': ['1612815154858-60aa4c59eaa6', 'Printer in home office', 'गृह कार्यालयमा प्रिन्टर'],
  'router-wifi-setup-nepal-best': ['1544197150-b99a580ef48a', 'WiFi router setup at home', 'घरमा WiFi राउटर सेटअप'],

  // ── PROPERTY NEW (5) ──
  'property-tax-nepal-2026-rates': ['1560518883-ce09cec164e6', 'Property documents and tax papers', 'सम्पत्ति कागजात र कर कागजपत्र'],
  'home-loan-nepal-banks-rates-emi': ['1560520653-9e0e4c89eb11', 'Bank building in Nepal', 'नेपालमा बैंक भवन'],
  'chitwan-real-estate-land-house-prices-2026': ['1500382017468-9049fed747ef', 'Land and houses in Chitwan', 'चितवनमा जग्गा र घरहरू'],
  'office-space-rent-kathmandu-prices': ['1497366216548-37526070297c', 'Office space for rent', 'भाडामा अफिस स्पेस'],
  'property-registration-nepal-rajaswa': ['1450101499163-c8848e968838', 'Property registration office', 'सम्पत्ति दर्ता कार्यालय'],

  // ── MOBILES NEW (5) ──
  'best-budget-phones-nepal-under-15000': ['1511707171634-5f897ff02aa9', 'Budget smartphones on display', 'प्रदर्शनमा बजेट स्मार्टफोनहरू'],
  '5g-phones-nepal-2026-network-guide': ['1512941937-1a5b9f1d8a6c', '5G phone with fast network', 'छिटो नेटवर्कसहित 5G फोन'],
  'phone-repair-vs-replace-nepal-cost': ['1580910051074-3eb694886f50', 'Phone repair workshop', 'फोन मर्मत कार्यशाला'],
  'best-gaming-phones-nepal-2026': ['1592899677977-9c10ca588bbd', 'Gaming phone with game display', 'गेम डिस्प्लेसहित गेमिङ फोन'],
  'mobile-insurance-nepal-worth-it': ['1556656195-b8de6024db38', 'Smartphone with insurance concept', 'बीमा अवधारणासहित स्मार्टफोन'],
};

async function main() {
  console.log('Adding featured images to blog posts...\n');

  let updated = 0;
  let notFound = 0;

  for (const [slug, [photoId, altEn, altNe]] of Object.entries(postImages)) {
    const post = await prisma.blog_posts.findUnique({ where: { slug } });
    if (!post) {
      console.log(`  ❌ Post not found: ${slug}`);
      notFound++;
      continue;
    }

    if (post.featured_image) {
      console.log(`  ⏭️  Already has image: ${slug}`);
      continue;
    }

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

  console.log(`\n✅ Updated ${updated} posts with featured images`);
  if (notFound) console.log(`⚠️  ${notFound} slugs not found in database`);

  const stillMissing = await prisma.blog_posts.count({ where: { featured_image: null } });
  console.log(`📊 Posts still missing images: ${stillMissing}`);
}

main()
  .catch(e => { console.error('❌ Failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());

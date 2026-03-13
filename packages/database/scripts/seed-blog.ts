import { prisma } from '../src/client';

async function main() {
  console.log('Seeding blog data...');

  // ── Authors ──────────────────────────────────────────────
  const authors = await Promise.all([
    prisma.blog_authors.upsert({
      where: { slug: 'rajesh-shrestha' },
      update: {},
      create: {
        name: 'Rajesh Shrestha',
        name_ne: 'राजेश श्रेष्ठ',
        slug: 'rajesh-shrestha',
        bio: 'Rajesh is a seasoned automotive journalist with over 12 years of experience covering Nepal\'s vehicle market. He has reviewed hundreds of cars and motorbikes and helps buyers make informed decisions.',
        bio_ne: 'राजेश नेपालको सवारी साधन बजारमा १२ वर्षभन्दा बढी अनुभव भएका अटोमोटिभ पत्रकार हुन्। उनले सयौं कार र मोटरसाइकलहरूको समीक्षा गरेका छन्।',
        credentials: 'Automotive Expert, 12+ years in Nepal market',
        credentials_ne: 'अटोमोटिभ विशेषज्ञ, नेपाल बजारमा १२+ वर्ष',
        expertise_areas: ['cars', 'motorbikes', 'electric-vehicles'],
        social_links: { facebook: 'https://facebook.com/rajesh.automotive', twitter: 'https://twitter.com/rajesh_auto_np' },
      },
    }),
    prisma.blog_authors.upsert({
      where: { slug: 'sita-gurung' },
      update: {},
      create: {
        name: 'Sita Gurung',
        name_ne: 'सीता गुरुङ',
        slug: 'sita-gurung',
        bio: 'Sita is a tech reviewer and gadget enthusiast based in Kathmandu. She specializes in mobile phones, laptops, and consumer electronics, helping Nepali buyers find the best deals.',
        bio_ne: 'सीता काठमाडौँमा रहेर काम गर्ने टेक रिभ्युअर र ग्याजेट उत्साही हुन्। उनले मोबाइल फोन, ल्यापटप र इलेक्ट्रोनिक्समा विशेषज्ञता राख्छिन्।',
        credentials: 'Tech Reviewer, Consumer Electronics Specialist',
        credentials_ne: 'टेक रिभ्युअर, उपभोक्ता इलेक्ट्रोनिक्स विशेषज्ञ',
        expertise_areas: ['mobiles', 'laptops', 'electronics'],
        social_links: { facebook: 'https://facebook.com/sita.tech', linkedin: 'https://linkedin.com/in/sitagurung' },
      },
    }),
    prisma.blog_authors.upsert({
      where: { slug: 'hari-tamang' },
      update: {},
      create: {
        name: 'Hari Tamang',
        name_ne: 'हरि तामाङ',
        slug: 'hari-tamang',
        bio: 'Hari is a real estate consultant and property market analyst with deep knowledge of Nepal\'s housing sector. He advises on property investments across Kathmandu Valley and beyond.',
        bio_ne: 'हरि रियल इस्टेट सल्लाहकार र सम्पत्ति बजार विश्लेषक हुन्। उनले काठमाडौँ उपत्यका र अन्य क्षेत्रमा सम्पत्ति लगानीमा सल्लाह दिन्छन्।',
        credentials: 'Real Estate Consultant, Property Market Analyst',
        credentials_ne: 'रियल इस्टेट सल्लाहकार, सम्पत्ति बजार विश्लेषक',
        expertise_areas: ['property', 'real-estate', 'land'],
        social_links: { facebook: 'https://facebook.com/hari.realestate' },
      },
    }),
    prisma.blog_authors.upsert({
      where: { slug: 'anita-maharjan' },
      update: {},
      create: {
        name: 'Anita Maharjan',
        name_ne: 'अनिता महर्जन',
        slug: 'anita-maharjan',
        bio: 'Anita is a consumer safety advocate and online marketplace expert. She writes about scam prevention, safe buying practices, and smart shopping tips for Nepali consumers.',
        bio_ne: 'अनिता उपभोक्ता सुरक्षा अधिवक्ता र अनलाइन बजार विशेषज्ञ हुन्। उनले ठगी रोकथाम र सुरक्षित किनमेल अभ्यासका बारेमा लेख्छिन्।',
        credentials: 'Consumer Safety Advocate, Online Marketplace Expert',
        credentials_ne: 'उपभोक्ता सुरक्षा अधिवक्ता, अनलाइन बजार विशेषज्ञ',
        expertise_areas: ['safety', 'scam-prevention', 'general'],
        social_links: { facebook: 'https://facebook.com/anita.consumer', twitter: 'https://twitter.com/anita_safe_np' },
      },
    }),
  ]);

  console.log(`✅ Created ${authors.length} authors`);

  // ── Categories ───────────────────────────────────────────
  const categories = await Promise.all([
    prisma.blog_categories.upsert({
      where: { slug: 'vehicles' },
      update: {},
      create: {
        name: 'Vehicles',
        name_ne: 'सवारी साधन',
        slug: 'vehicles',
        description: 'Tips and guides for buying and selling cars, motorbikes, and other vehicles in Nepal.',
        description_ne: 'नेपालमा कार, मोटरसाइकल र अन्य सवारी साधन किन्ने र बेच्ने टिप्स र गाइडहरू।',
        display_order: 1,
      },
    }),
    prisma.blog_categories.upsert({
      where: { slug: 'electronics' },
      update: {},
      create: {
        name: 'Electronics',
        name_ne: 'इलेक्ट्रोनिक्स',
        slug: 'electronics',
        description: 'Guides for buying and selling mobiles, laptops, and gadgets in Nepal.',
        description_ne: 'नेपालमा मोबाइल, ल्यापटप र ग्याजेटहरू किन्ने र बेच्ने गाइडहरू।',
        display_order: 2,
      },
    }),
    prisma.blog_categories.upsert({
      where: { slug: 'property' },
      update: {},
      create: {
        name: 'Property',
        name_ne: 'सम्पत्ति',
        slug: 'property',
        description: 'Real estate tips, property buying guides, and market trends in Nepal.',
        description_ne: 'नेपालमा रियल इस्टेट टिप्स, सम्पत्ति किन्ने गाइड र बजार प्रवृत्तिहरू।',
        display_order: 3,
      },
    }),
    prisma.blog_categories.upsert({
      where: { slug: 'safety-tips' },
      update: {},
      create: {
        name: 'Safety Tips',
        name_ne: 'सुरक्षा टिप्स',
        slug: 'safety-tips',
        description: 'How to avoid scams and stay safe when buying and selling online in Nepal.',
        description_ne: 'नेपालमा अनलाइन किनबेच गर्दा ठगीबाट बच्ने र सुरक्षित रहने तरिकाहरू।',
        display_order: 4,
      },
    }),
    prisma.blog_categories.upsert({
      where: { slug: 'buying-guides' },
      update: {},
      create: {
        name: 'Buying Guides',
        name_ne: 'किन्ने गाइड',
        slug: 'buying-guides',
        description: 'Comprehensive buying guides for all product categories in Nepal.',
        description_ne: 'नेपालमा सबै उत्पादन श्रेणीहरूको लागि विस्तृत किन्ने गाइडहरू।',
        display_order: 5,
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} blog categories`);

  // ── Tags ─────────────────────────────────────────────────
  const tagData = [
    { name: 'Cars', name_ne: 'कार', slug: 'cars' },
    { name: 'Motorbikes', name_ne: 'मोटरसाइकल', slug: 'motorbikes' },
    { name: 'Mobile Phones', name_ne: 'मोबाइल फोन', slug: 'mobile-phones' },
    { name: 'Laptops', name_ne: 'ल्यापटप', slug: 'laptops' },
    { name: 'Second Hand', name_ne: 'सेकेन्ड ह्यान्ड', slug: 'second-hand' },
    { name: 'Price Guide', name_ne: 'मूल्य गाइड', slug: 'price-guide' },
    { name: 'Nepal Market', name_ne: 'नेपाल बजार', slug: 'nepal-market' },
    { name: 'Scam Prevention', name_ne: 'ठगी रोकथाम', slug: 'scam-prevention' },
    { name: 'Electric Vehicles', name_ne: 'इलेक्ट्रिक गाडी', slug: 'electric-vehicles' },
    { name: 'Property Tips', name_ne: 'सम्पत्ति टिप्स', slug: 'property-tips' },
    { name: 'Kathmandu', name_ne: 'काठमाडौँ', slug: 'kathmandu' },
    { name: 'Budget Friendly', name_ne: 'बजेट मैत्री', slug: 'budget-friendly' },
  ];

  const tags = await Promise.all(
    tagData.map(t =>
      prisma.blog_tags.upsert({
        where: { slug: t.slug },
        update: {},
        create: t,
      })
    )
  );

  console.log(`✅ Created ${tags.length} tags`);

  // ── Helper to find by slug ──────────────────────────────
  const authorBySlug = (slug: string) => authors.find(a => a.slug === slug)!;
  const catBySlug = (slug: string) => categories.find(c => c.slug === slug)!;
  const tagBySlug = (slug: string) => tags.find(t => t.slug === slug)!;

  // ── Sample Blog Posts ────────────────────────────────────
  const postsData = [
    {
      title: 'How to Sell Your Used Car in Nepal: Complete Guide 2026',
      title_ne: 'नेपालमा आफ्नो पुरानो कार कसरी बेच्ने: पूर्ण गाइड २०२६',
      slug: 'how-to-sell-used-car-nepal-guide-2026',
      excerpt: 'Learn the step-by-step process to sell your used car in Nepal. From pricing to paperwork, this guide covers everything you need for a successful sale.',
      excerpt_ne: 'नेपालमा आफ्नो पुरानो कार बेच्ने चरणबद्ध प्रक्रिया सिक्नुहोस्। मूल्य निर्धारणदेखि कागजात सम्म, यो गाइडले सबै कुरा समेट्छ।',
      content: `<h2 id="why-sell-on-thulo-bazaar">Why Sell Your Car on Thulo Bazaar?</h2>
<p>Selling a used car in Nepal can be a daunting task, but with the right approach and platform, you can get a fair price quickly. Thulo Bazaar connects you with thousands of potential buyers across Nepal, making it the ideal marketplace for vehicle sales.</p>

<h2 id="step-1-determine-fair-price">Step 1: Determine the Fair Market Price</h2>
<p>Before listing your car, research the current market value. Check similar models on Thulo Bazaar to understand the going rate. Consider factors like:</p>
<ul>
<li>Year of manufacture and model</li>
<li>Kilometers driven (odometer reading)</li>
<li>Overall condition (engine, body, interior)</li>
<li>Service history and maintenance records</li>
<li>Number of previous owners</li>
</ul>

<h2 id="step-2-prepare-documents">Step 2: Prepare Your Documents</h2>
<p>In Nepal, you'll need the following documents for a vehicle sale:</p>
<ul>
<li><strong>Bluebook (नीलपुस्तिका)</strong> — The vehicle registration certificate</li>
<li><strong>Tax clearance certificate</strong> — Proof that road tax is paid</li>
<li><strong>Insurance papers</strong> — Current insurance policy</li>
<li><strong>Citizenship/ID</strong> — Owner's identification</li>
</ul>

<h2 id="step-3-take-great-photos">Step 3: Take Great Photos</h2>
<p>High-quality photos are crucial for attracting buyers. Take clear photos of the exterior from all angles, interior, dashboard, engine bay, and any unique features. Natural daylight works best.</p>

<h3 id="photo-tips">Photo Tips for Better Results</h3>
<p>Clean your car thoroughly before photographing. Show both the strengths and honestly represent any wear or damage. Buyers appreciate transparency.</p>

<h2 id="step-4-create-listing">Step 4: Create Your Listing on Thulo Bazaar</h2>
<p>Write a detailed, honest description. Include the make, model, year, mileage, fuel type, and any modifications or recent repairs. Set a competitive price based on your research.</p>

<h2 id="step-5-negotiate-safely">Step 5: Negotiate and Close the Deal Safely</h2>
<p>Meet buyers in public places. Verify their identity before allowing test drives. Use Thulo Bazaar's messaging system to keep communications on the platform. Complete the ownership transfer at the transport office (यातायात कार्यालय).</p>`,
      content_ne: `<h2 id="why-sell-on-thulo-bazaar">किन Thulo Bazaar मा कार बेच्ने?</h2>
<p>नेपालमा पुरानो कार बेच्नु चुनौतीपूर्ण हुन सक्छ, तर सही दृष्टिकोण र प्लेटफर्मले तपाईंलाई छिटो उचित मूल्य पाउन मद्दत गर्छ। Thulo Bazaar ले तपाईंलाई नेपालभरका हजारौं सम्भावित खरिदकर्ताहरूसँग जोड्छ।</p>

<h2 id="step-1-determine-fair-price">चरण १: उचित बजार मूल्य निर्धारण गर्नुहोस्</h2>
<p>कार सूचीकरण गर्नुअघि, हालको बजार मूल्य अनुसन्धान गर्नुहोस्। Thulo Bazaar मा समान मोडेलहरू हेर्नुहोस्। यी कुराहरू विचार गर्नुहोस्:</p>
<ul>
<li>निर्माण वर्ष र मोडेल</li>
<li>चलेको किलोमिटर</li>
<li>समग्र अवस्था (इन्जिन, बडी, भित्री)</li>
<li>सर्भिस इतिहास</li>
<li>पहिलेका मालिकहरूको संख्या</li>
</ul>

<h2 id="step-2-prepare-documents">चरण २: कागजातहरू तयार गर्नुहोस्</h2>
<p>नेपालमा सवारी साधन बिक्रीका लागि तपाईंलाई यी कागजातहरू चाहिन्छ:</p>
<ul>
<li><strong>नीलपुस्तिका</strong> — सवारी साधन दर्ता प्रमाणपत्र</li>
<li><strong>कर चुक्ता प्रमाणपत्र</strong> — सडक कर तिरेको प्रमाण</li>
<li><strong>बीमा कागजात</strong> — हालको बीमा पोलिसी</li>
<li><strong>नागरिकता/परिचयपत्र</strong> — मालिकको पहिचान</li>
</ul>

<h2 id="step-3-take-great-photos">चरण ३: राम्रा फोटोहरू खिच्नुहोस्</h2>
<p>उच्च गुणस्तरका फोटोहरू खरिदकर्ताहरूलाई आकर्षित गर्न महत्त्वपूर्ण छन्। बाहिर, भित्र, ड्यासबोर्ड, इन्जिन र कुनै विशेष सुविधाहरूको स्पष्ट फोटो लिनुहोस्।</p>

<h2 id="step-4-create-listing">चरण ४: Thulo Bazaar मा सूची बनाउनुहोस्</h2>
<p>विस्तृत, इमानदार विवरण लेख्नुहोस्। मेक, मोडेल, वर्ष, माइलेज, इन्धन प्रकार, र कुनै पनि परिमार्जन वा हालैको मर्मत समावेश गर्नुहोस्।</p>

<h2 id="step-5-negotiate-safely">चरण ५: सुरक्षित रूपमा सम्झौता गर्नुहोस्</h2>
<p>खरिदकर्ताहरूसँग सार्वजनिक ठाउँमा भेट्नुहोस्। टेस्ट ड्राइभ दिनुअघि तिनीहरूको पहिचान प्रमाणित गर्नुहोस्। यातायात कार्यालयमा स्वामित्व हस्तान्तरण पूरा गर्नुहोस्।</p>`,
      meta_description: 'Complete guide to selling your used car in Nepal in 2026. Learn pricing, documentation, photography tips, and how to close the deal safely on Thulo Bazaar.',
      meta_description_ne: 'नेपालमा पुरानो कार बेच्ने पूर्ण गाइड। मूल्य निर्धारण, कागजात, फोटो टिप्स र सुरक्षित बिक्री।',
      author_slug: 'rajesh-shrestha',
      category_slug: 'vehicles',
      tag_slugs: ['cars', 'second-hand', 'nepal-market'],
      reading_time_min: 8,
      linked_category_slugs: ['cars'],
    },
    {
      title: 'Best Budget Smartphones Under NPR 20,000 in Nepal (2026)',
      title_ne: 'नेपालमा रु. २०,००० भन्दा कममा उत्कृष्ट स्मार्टफोनहरू (२०२६)',
      slug: 'best-budget-smartphones-under-20000-nepal-2026',
      excerpt: 'Looking for an affordable smartphone in Nepal? Here are the top picks under NPR 20,000 with the best cameras, battery life, and performance.',
      excerpt_ne: 'नेपालमा सस्तो स्मार्टफोन खोज्दै हुनुहुन्छ? यहाँ रु. २०,००० भन्दा कममा उत्कृष्ट क्यामेरा, ब्याट्री र प्रदर्शन भएका फोनहरू छन्।',
      content: `<h2 id="budget-phone-market-nepal">Budget Phone Market in Nepal 2026</h2>
<p>Nepal's smartphone market has grown significantly, with budget phones offering impressive features. Whether you're a student, professional, or looking for your first smartphone, there are excellent options under NPR 20,000.</p>

<h2 id="top-picks">Our Top 5 Picks</h2>

<h3 id="pick-1">1. Redmi Note 14</h3>
<p>The Redmi Note 14 continues Xiaomi's tradition of excellent budget phones. With a 6.67" AMOLED display, 50MP camera, and 5000mAh battery, it offers outstanding value at around NPR 18,000.</p>
<ul>
<li>Display: 6.67" AMOLED, 120Hz</li>
<li>Camera: 50MP main + 8MP ultrawide</li>
<li>Battery: 5000mAh with 33W fast charging</li>
<li>Processor: MediaTek Dimensity 7025</li>
</ul>

<h3 id="pick-2">2. Samsung Galaxy A16</h3>
<p>Samsung's A-series delivers reliable performance with good software support. The Galaxy A16 is priced around NPR 17,500 and comes with Samsung's One UI and guaranteed updates.</p>

<h3 id="pick-3">3. Realme C67</h3>
<p>Realme offers aggressive pricing with the C67 at around NPR 15,000. Great for those who prioritize camera quality on a tight budget.</p>

<h3 id="pick-4">4. Infinix Hot 50 Pro</h3>
<p>The Hot 50 Pro brings premium design elements to the budget segment at NPR 14,500. Features a glass back and decent performance.</p>

<h3 id="pick-5">5. Tecno Spark 30</h3>
<p>At under NPR 12,000, the Tecno Spark 30 is the most affordable option with a large display and long battery life — perfect for basic use and social media.</p>

<h2 id="buying-tips">Buying Tips for Nepal</h2>
<p>When buying a smartphone in Nepal, always purchase from authorized dealers or trusted sellers on Thulo Bazaar. Check for official warranty, verify IMEI registration, and compare prices across multiple sellers before making your decision.</p>

<h2 id="where-to-buy">Where to Buy</h2>
<p>You can find great deals on both new and second-hand smartphones on <strong>Thulo Bazaar</strong>. Browse our mobile phones category to compare prices from sellers across Nepal.</p>`,
      content_ne: `<h2 id="budget-phone-market-nepal">नेपालमा बजेट फोन बजार २०२६</h2>
<p>नेपालको स्मार्टफोन बजार उल्लेखनीय रूपमा बढेको छ। विद्यार्थी होस् वा पेशेवर, रु. २०,००० भन्दा कममा उत्कृष्ट विकल्पहरू छन्।</p>

<h2 id="top-picks">हाम्रा शीर्ष ५ छनोटहरू</h2>

<h3 id="pick-1">१. Redmi Note 14</h3>
<p>Redmi Note 14 ले Xiaomi को उत्कृष्ट बजेट फोनको परम्परा जारी राख्छ। 6.67" AMOLED डिस्प्ले, 50MP क्यामेरा, र 5000mAh ब्याट्रीसहित, यसले लगभग रु. १८,००० मा उत्कृष्ट मूल्य प्रदान गर्छ।</p>

<h3 id="pick-2">२. Samsung Galaxy A16</h3>
<p>Samsung को A-series ले राम्रो सफ्टवेयर सपोर्टसहित भरपर्दो प्रदर्शन दिन्छ। Galaxy A16 को मूल्य लगभग रु. १७,५०० छ।</p>

<h3 id="pick-3">३. Realme C67</h3>
<p>Realme ले C67 मा लगभग रु. १५,००० मा आक्रामक मूल्य प्रस्ताव गर्छ। कम बजेटमा क्यामेरा गुणस्तरलाई प्राथमिकता दिनेहरूका लागि उत्तम।</p>

<h3 id="pick-4">४. Infinix Hot 50 Pro</h3>
<p>Hot 50 Pro ले रु. १४,५०० मा बजेट खण्डमा प्रिमियम डिजाइन तत्वहरू ल्याउँछ।</p>

<h3 id="pick-5">५. Tecno Spark 30</h3>
<p>रु. १२,००० भन्दा कममा, Tecno Spark 30 ठूलो डिस्प्ले र लामो ब्याट्री लाइफसहित सबैभन्दा सस्तो विकल्प हो।</p>

<h2 id="buying-tips">नेपालमा किन्ने टिप्स</h2>
<p>नेपालमा स्मार्टफोन किन्दा सधैं अधिकृत डिलरहरू वा Thulo Bazaar मा विश्वसनीय विक्रेताहरूबाट किन्नुहोस्। आधिकारिक वारेन्टी जाँच गर्नुहोस्, IMEI दर्ता प्रमाणित गर्नुहोस्।</p>

<h2 id="where-to-buy">कहाँ किन्ने</h2>
<p>तपाईंले <strong>Thulo Bazaar</strong> मा नयाँ र सेकेन्ड ह्यान्ड दुवै स्मार्टफोनमा राम्रा सम्झौताहरू पाउन सक्नुहुन्छ।</p>`,
      meta_description: 'Top 5 budget smartphones under NPR 20,000 in Nepal for 2026. Compare Redmi, Samsung, Realme, Infinix & Tecno phones with specs, prices, and buying tips.',
      meta_description_ne: 'नेपालमा रु. २०,००० भन्दा कममा शीर्ष ५ बजेट स्मार्टफोनहरू। Redmi, Samsung, Realme को तुलना।',
      author_slug: 'sita-gurung',
      category_slug: 'electronics',
      tag_slugs: ['mobile-phones', 'budget-friendly', 'nepal-market'],
      reading_time_min: 6,
      linked_category_slugs: ['mobile-phones'],
    },
    {
      title: 'How to Avoid Online Shopping Scams in Nepal: 10 Essential Tips',
      title_ne: 'नेपालमा अनलाइन शपिङ ठगीबाट कसरी बच्ने: १० आवश्यक टिप्स',
      slug: 'how-to-avoid-online-shopping-scams-nepal',
      excerpt: 'Protect yourself from online scams in Nepal. Learn 10 practical tips to identify fraudulent sellers and shop safely on online marketplaces.',
      excerpt_ne: 'नेपालमा अनलाइन ठगीबाट आफूलाई जोगाउनुहोस्। धोखाधडी विक्रेताहरू पहिचान गर्न र सुरक्षित किनमेल गर्न १० व्यावहारिक टिप्स सिक्नुहोस्।',
      content: `<h2 id="rising-online-scams">Rising Online Scams in Nepal</h2>
<p>As online shopping grows in Nepal, so do the risks of scams. From fake product listings to advance payment fraud, Nepali consumers need to be vigilant. Here are 10 essential tips to protect yourself.</p>

<h2 id="tip-1">1. Verify the Seller's Profile</h2>
<p>On Thulo Bazaar, check if the seller is verified. Look for the verification badge, read their reviews, and check how long they've been on the platform. New accounts with too-good-to-be-true deals are red flags.</p>

<h2 id="tip-2">2. Never Pay Full Amount in Advance</h2>
<p>Legitimate sellers understand buyer caution. Avoid paying the full amount before seeing the product. If a seller insists on advance payment, consider it a warning sign.</p>

<h2 id="tip-3">3. Meet in Public Places</h2>
<p>Always meet sellers in safe, public locations — busy marketplaces, bank premises, or police station areas. Never go to isolated locations, especially for high-value items.</p>

<h2 id="tip-4">4. Check Product Authenticity</h2>
<p>For electronics, verify IMEI numbers, serial numbers, and warranty cards. For vehicles, check the bluebook and verify the chassis number matches the documents.</p>

<h2 id="tip-5">5. Use Thulo Bazaar's Messaging System</h2>
<p>Keep all communications on the platform. This creates a record of conversations that can help resolve disputes. Scammers often try to move conversations to WhatsApp or Viber quickly.</p>

<h2 id="tip-6">6. Be Wary of Unrealistic Prices</h2>
<p>If a deal seems too good to be true, it probably is. A brand new iPhone for NPR 20,000? That's almost certainly a scam. Research market prices before buying.</p>

<h2 id="tip-7">7. Inspect Before Paying</h2>
<p>Always physically inspect the item before making payment. Test electronics, check vehicle conditions, and verify that the product matches the listing description.</p>

<h2 id="tip-8">8. Use Secure Payment Methods</h2>
<p>When possible, use traceable payment methods like bank transfers or digital wallets (eSewa, Khalti). Avoid sending cash through unknown third parties.</p>

<h2 id="tip-9">9. Trust Your Instincts</h2>
<p>If something feels off about a transaction — the seller is too pushy, avoids phone calls, or has inconsistent stories — walk away. There will always be other deals.</p>

<h2 id="tip-10">10. Report Suspicious Listings</h2>
<p>Help keep the marketplace safe by reporting suspicious listings on Thulo Bazaar. Our team reviews reports and takes action against fraudulent accounts.</p>

<h2 id="what-to-do-scammed">What to Do If You've Been Scammed</h2>
<p>If you've fallen victim to an online scam in Nepal, file a complaint at your nearest police station. You can also report cybercrime at the Nepal Police Cyber Bureau. Keep all evidence — screenshots, payment receipts, and communication records.</p>`,
      content_ne: `<h2 id="rising-online-scams">नेपालमा बढ्दो अनलाइन ठगी</h2>
<p>नेपालमा अनलाइन शपिङ बढ्दै जाँदा, ठगीको जोखिम पनि बढेको छ। नक्कली उत्पादन सूचीदेखि अग्रिम भुक्तानी ठगीसम्म, नेपाली उपभोक्ताहरू सतर्क हुनुपर्छ।</p>

<h2 id="tip-1">१. विक्रेताको प्रोफाइल प्रमाणित गर्नुहोस्</h2>
<p>Thulo Bazaar मा, विक्रेता प्रमाणित छ कि छैन जाँच गर्नुहोस्। प्रमाणीकरण ब्याज खोज्नुहोस्, तिनीहरूका समीक्षाहरू पढ्नुहोस्।</p>

<h2 id="tip-2">२. कहिल्यै पूरा रकम अग्रिम नतिर्नुहोस्</h2>
<p>वैध विक्रेताहरूले खरिदकर्ताको सावधानी बुझ्छन्। उत्पादन नदेखी पूरा रकम तिर्नबाट बच्नुहोस्।</p>

<h2 id="tip-3">३. सार्वजनिक ठाउँमा भेट्नुहोस्</h2>
<p>सधैं सुरक्षित, सार्वजनिक स्थानहरूमा विक्रेताहरूसँग भेट्नुहोस् — व्यस्त बजार, बैंक परिसर, वा प्रहरी चौकी क्षेत्र।</p>

<h2 id="tip-4">४. उत्पादनको प्रामाणिकता जाँच गर्नुहोस्</h2>
<p>इलेक्ट्रोनिक्सको लागि IMEI नम्बर, सिरियल नम्बर र वारेन्टी कार्ड प्रमाणित गर्नुहोस्। सवारी साधनको लागि नीलपुस्तिका जाँच गर्नुहोस्।</p>

<h2 id="tip-5">५. Thulo Bazaar को मेसेजिङ प्रणाली प्रयोग गर्नुहोस्</h2>
<p>सबै सञ्चार प्लेटफर्ममा राख्नुहोस्। ठगहरूले प्रायः कुराकानी WhatsApp वा Viber मा सार्ने प्रयास गर्छन्।</p>

<h2 id="tip-6">६. अवास्तविक मूल्यबाट सावधान रहनुहोस्</h2>
<p>यदि सम्झौता साँच्चिकै धेरै राम्रो लाग्छ भने, यो सम्भवतः ठगी हो। किन्नुअघि बजार मूल्य अनुसन्धान गर्नुहोस्।</p>

<h2 id="tip-7">७. तिर्नुअघि जाँच गर्नुहोस्</h2>
<p>भुक्तानी गर्नुअघि सधैं वस्तुको भौतिक निरीक्षण गर्नुहोस्।</p>

<h2 id="tip-8">८. सुरक्षित भुक्तानी विधिहरू प्रयोग गर्नुहोस्</h2>
<p>सम्भव भएसम्म बैंक ट्रान्सफर वा डिजिटल वालेट (eSewa, Khalti) जस्ता ट्रेसयोग्य भुक्तानी विधिहरू प्रयोग गर्नुहोस्।</p>

<h2 id="tip-9">९. आफ्नो सहज बुद्धिमा भरोसा गर्नुहोस्</h2>
<p>यदि कारोबारमा केही गलत लाग्छ भने — हिँड्नुहोस्। अर्को सम्झौता सधैं आउनेछ।</p>

<h2 id="tip-10">१०. शंकास्पद सूचीहरू रिपोर्ट गर्नुहोस्</h2>
<p>Thulo Bazaar मा शंकास्पद सूचीहरू रिपोर्ट गरेर बजार सुरक्षित राख्न मद्दत गर्नुहोस्।</p>

<h2 id="what-to-do-scammed">ठगी भएमा के गर्ने</h2>
<p>यदि तपाईं अनलाइन ठगीको शिकार हुनुभएको छ भने, नजिकैको प्रहरी चौकीमा उजुरी दर्ता गर्नुहोस्। नेपाल प्रहरी साइबर ब्यूरोमा पनि रिपोर्ट गर्न सक्नुहुन्छ।</p>`,
      meta_description: '10 essential tips to avoid online shopping scams in Nepal. Learn how to identify fraudulent sellers, shop safely, and protect your money on online marketplaces.',
      meta_description_ne: 'नेपालमा अनलाइन ठगीबाट बच्ने १० आवश्यक टिप्स। धोखाधडी विक्रेता पहिचान गर्ने र सुरक्षित किनमेल गर्ने।',
      author_slug: 'anita-maharjan',
      category_slug: 'safety-tips',
      tag_slugs: ['scam-prevention', 'nepal-market'],
      reading_time_min: 7,
      linked_category_slugs: [],
    },
  ];

  for (const postData of postsData) {
    const existing = await prisma.blog_posts.findUnique({ where: { slug: postData.slug } });
    if (existing) {
      console.log(`  ⏭ Post "${postData.slug}" already exists, skipping`);
      continue;
    }

    const author = authorBySlug(postData.author_slug);
    const category = catBySlug(postData.category_slug);
    const postTags = postData.tag_slugs.map(s => tagBySlug(s));

    const post = await prisma.blog_posts.create({
      data: {
        title: postData.title,
        title_ne: postData.title_ne,
        slug: postData.slug,
        excerpt: postData.excerpt,
        excerpt_ne: postData.excerpt_ne,
        content: postData.content,
        content_ne: postData.content_ne,
        meta_description: postData.meta_description,
        meta_description_ne: postData.meta_description_ne,
        status: 'published',
        author_id: author.id,
        category_id: category.id,
        reading_time_min: postData.reading_time_min,
        is_featured: false,
        published_at: new Date(),
        linked_category_slugs: postData.linked_category_slugs,
      },
    });

    // Create tag associations
    for (const tag of postTags) {
      await prisma.blog_post_tags.create({
        data: { post_id: post.id, tag_id: tag.id },
      });
    }

    console.log(`  ✅ Created post: "${postData.slug}"`);
  }

  console.log('\n🎉 Blog seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

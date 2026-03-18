import type { PostData } from './vehicles-posts';

export const propertyNewPosts: PostData[] = [
  // ── Post 1 ──────────────────────────────────────────────────────────────────
  {
    title: 'Property Tax Nepal 2026: Rates & How to Pay',
    title_ne: 'सम्पत्ति कर नेपाल २०२६: दरहरू र कसरी तिर्ने',
    slug: 'property-tax-nepal-rates-how-to-pay',
    excerpt: 'Understand Nepal\'s property tax system in 2026. Learn the tax rates for land and buildings, how to calculate your liability, and step-by-step payment process at your local ward office.',
    excerpt_ne: '२०२६ मा नेपालको सम्पत्ति कर प्रणाली बुझ्नुहोस्। जग्गा र भवनको कर दर, तपाईंको दायित्व गणना र वडा कार्यालयमा भुक्तानी प्रक्रिया।',
    content: `<h2 id="overview">Property Tax in Nepal: What You Need to Know</h2>
<p>Every property owner in Nepal must pay annual property tax (सम्पत्ति कर) to their local municipality or rural municipality. The tax is calculated based on land area, building size, location, and property use (residential vs commercial). Failure to pay results in penalties of 5–15% per year and can complicate future property transactions.</p>

<h2 id="tax-rates">Property Tax Rates in Nepal 2026</h2>
<h3 id="land-tax">Land Tax (मालपोत)</h3>
<ul>
  <li><strong>Kathmandu Metropolitan:</strong> NPR 2–25 per sq.ft depending on zone (core areas like New Road are highest).</li>
  <li><strong>Sub-Metropolitan cities (Lalitpur, Pokhara, Biratnagar):</strong> NPR 1–15 per sq.ft.</li>
  <li><strong>Municipalities:</strong> NPR 0.50–8 per sq.ft.</li>
  <li><strong>Rural municipalities:</strong> NPR 0.25–3 per sq.ft.</li>
</ul>

<h3 id="building-tax">Building/House Tax (घर कर)</h3>
<ul>
  <li>Based on total built-up area and number of floors.</li>
  <li>Residential: NPR 0.50–5 per sq.ft per year.</li>
  <li>Commercial: 2–5x residential rates.</li>
  <li>Rental properties: Additional rental income tax applies.</li>
</ul>

<h2 id="how-to-calculate">How to Calculate Your Property Tax</h2>
<ol>
  <li>Find your property's land area from your लालपुर्जा (land ownership certificate).</li>
  <li>Determine your municipality's tax zone — check at your local ward office or municipality website.</li>
  <li>Multiply land area × applicable rate for land tax.</li>
  <li>Add building tax based on built-up area × floor count × building rate.</li>
  <li>Deductions may apply for senior citizens, disabled persons, and properties under dispute.</li>
</ol>

<h2 id="payment-process">Step-by-Step Payment Process</h2>
<ol>
  <li><strong>Visit your ward office</strong> with your land ownership certificate (लालपुर्जा) and citizenship (नागरिकता).</li>
  <li><strong>Get assessment:</strong> The revenue section calculates your tax based on property records.</li>
  <li><strong>Pay at the counter:</strong> Cash, cheque, or in some municipalities via eSewa/Khalti.</li>
  <li><strong>Get receipt:</strong> Keep this safely — you'll need it for any property transaction.</li>
  <li><strong>Deadline:</strong> Property tax is due by the end of the fiscal year (mid-July). Early payment may get 5–10% discount in some municipalities.</li>
</ol>

<h2 id="online-payment">Online Property Tax Payment</h2>
<p>Several municipalities now support online tax payment:</p>
<ul>
  <li>Kathmandu Metropolitan City: Online portal available for registered property owners.</li>
  <li>Lalitpur Metropolitan: Digital payment through local governance portal.</li>
  <li>Other municipalities: Check if your municipality has partnered with eSewa, Khalti, or ConnectIPS.</li>
</ul>

<h2 id="penalties">Penalties for Late Payment</h2>
<ul>
  <li>5% penalty for first year of delay.</li>
  <li>10–15% additional penalty for subsequent years.</li>
  <li>Outstanding tax blocks property transfer, mortgage, and division (बण्डा) processes.</li>
  <li>The municipality can also place a hold on building permits.</li>
</ul>

<h2 id="tax-clearance">Tax Clearance for Property Transactions</h2>
<p>When buying or selling property through <strong>Thulo Bazaar</strong> or any channel, both buyer and seller should verify that all property taxes are paid up to date. A tax clearance certificate (कर चुक्ता प्रमाणपत्र) from the municipality is mandatory for property registration at the Land Revenue Office (मालपोत कार्यालय). Always request this document before finalising any property deal on <strong>Thulo Bazaar</strong>.</p>`,

    content_ne: `<h2 id="overview">नेपालमा सम्पत्ति कर: तपाईंले जान्नुपर्ने कुरा</h2>
<p>नेपालमा हरेक सम्पत्ति मालिकले आफ्नो स्थानीय नगरपालिका वा गाउँपालिकालाई वार्षिक सम्पत्ति कर तिर्नुपर्छ। कर जग्गा क्षेत्रफल, भवन साइज, स्थान र प्रयोग (आवासीय बनाम व्यावसायिक) मा आधारित गणना गरिन्छ। नतिरे वार्षिक ५–१५% जरिवाना लाग्छ।</p>

<h2 id="tax-rates">सम्पत्ति कर दरहरू</h2>
<h3 id="land-tax">जग्गा कर (मालपोत)</h3>
<ul>
  <li><strong>काठमाडौँ महानगर:</strong> प्रति वर्ग फिट रु २–२५।</li>
  <li><strong>उपमहानगर:</strong> प्रति वर्ग फिट रु १–१५।</li>
  <li><strong>नगरपालिका:</strong> प्रति वर्ग फिट रु ०.५०–८।</li>
</ul>

<h2 id="payment-process">भुक्तानी प्रक्रिया</h2>
<ol>
  <li>लालपुर्जा र नागरिकतासहित वडा कार्यालय जानुहोस्।</li>
  <li>राजस्व शाखामा कर गणना गराउनुहोस्।</li>
  <li>काउन्टरमा तिर्नुहोस् — नगद, चेक वा eSewa/Khalti।</li>
  <li>रसिद सुरक्षित राख्नुहोस्।</li>
  <li>आर्थिक वर्षको अन्त्यसम्म तिर्नुपर्छ।</li>
</ol>

<h2 id="tax-clearance">सम्पत्ति कारोबारका लागि कर चुक्ता</h2>
<p><strong>Thulo Bazaar</strong> वा कुनै पनि माध्यमबाट सम्पत्ति किन्दा वा बेच्दा सबै सम्पत्ति कर तिरिएको प्रमाणित गर्नुहोस्। मालपोत कार्यालयमा सम्पत्ति दर्ताका लागि कर चुक्ता प्रमाणपत्र अनिवार्य छ।</p>`,
    meta_description: 'Property tax in Nepal 2026: rates for land and buildings, calculation guide, payment process at ward offices, and penalties for late payment.',
    meta_description_ne: 'नेपालमा सम्पत्ति कर २०२६: जग्गा र भवनको दर, गणना गाइड, वडा कार्यालयमा भुक्तानी प्रक्रिया।',
    author_slug: 'hari-tamang',
    category_slug: 'property',
    tag_slugs: ['property-tips', 'nepal-market'],
    reading_time_min: 5,
    linked_category_slugs: ['land-for-sale'],
  },

  // ── Post 2 ──────────────────────────────────────────────────────────────────
  {
    title: 'Home Loan Nepal: Banks, Rates & EMI Guide',
    title_ne: 'गृह ऋण नेपाल: बैंक, ब्याजदर र EMI गाइड',
    slug: 'home-loan-nepal-banks-rates-emi-guide',
    excerpt: 'Planning to buy a house or apartment in Nepal with a bank loan? Compare home loan interest rates from major Nepali banks, understand EMI calculations, and learn the application process.',
    excerpt_ne: 'बैंक ऋणबाट नेपालमा घर वा अपार्टमेन्ट किन्ने योजना? प्रमुख नेपाली बैंकहरूको गृह ऋण ब्याजदर तुलना, EMI गणना र आवेदन प्रक्रिया बुझ्नुहोस्।',
    content: `<h2 id="home-loan-basics">Home Loans in Nepal: The Basics</h2>
<p>With property prices in Kathmandu Valley ranging from NPR 50 lakh to 5 crore+ for a house, most buyers need bank financing. Nepali banks offer home loans (गृह कर्जा) for purchasing houses, apartments, land (for construction), and home renovation. Understanding interest rates, terms, and eligibility is crucial before committing to a 15–25 year loan.</p>

<h2 id="interest-rates">Home Loan Interest Rates 2026</h2>
<p>Nepal's home loan rates are linked to the base rate set by each bank. As of 2026:</p>
<ul>
  <li><strong>NIC Asia Bank:</strong> 9.5–11.5% (base rate + premium).</li>
  <li><strong>Nabil Bank:</strong> 10–12%.</li>
  <li><strong>NMB Bank:</strong> 9.8–11.8%.</li>
  <li><strong>Global IME Bank:</strong> 9.5–11.5%.</li>
  <li><strong>Himalayan Bank:</strong> 10–12%.</li>
  <li><strong>Nepal Bank Limited:</strong> 9–11% (often slightly lower as a government bank).</li>
</ul>
<p>Rates fluctuate based on Nepal Rastra Bank's monetary policy. Check current rates directly with banks before applying.</p>

<h2 id="emi-calculation">EMI Calculation Example</h2>
<p>For a home loan of NPR 50 lakh at 10.5% interest for 20 years:</p>
<ul>
  <li><strong>Monthly EMI:</strong> Approximately NPR 50,200.</li>
  <li><strong>Total interest paid:</strong> NPR 70.5 lakh over 20 years.</li>
  <li><strong>Total amount paid:</strong> NPR 1.2 crore (loan + interest).</li>
</ul>
<p>Even a 1% rate difference significantly affects total cost. NPR 50 lakh at 9.5% for 20 years = EMI of NPR 46,600 (saving NPR 3,600/month or NPR 8.6 lakh over the loan term).</p>

<h2 id="eligibility">Eligibility Requirements</h2>
<ul>
  <li><strong>Age:</strong> 21–60 years (loan must be repaid before age 65 typically).</li>
  <li><strong>Income proof:</strong> Salary certificate, tax returns, or business income documentation.</li>
  <li><strong>Down payment:</strong> Minimum 20–40% of property value (banks finance 60–80%).</li>
  <li><strong>Property documents:</strong> लालपुर्जा, building permit, approved map.</li>
  <li><strong>Credit history:</strong> Clean record with Credit Information Bureau (CIBIL Nepal).</li>
</ul>

<h2 id="application-process">Application Process</h2>
<ol>
  <li>Choose a bank with competitive rates and good service.</li>
  <li>Submit application with required documents (citizenship, income proof, property papers).</li>
  <li>Bank conducts property valuation and legal verification.</li>
  <li>Loan sanction letter issued with terms and conditions.</li>
  <li>Property mortgage registration at Land Revenue Office.</li>
  <li>Loan disbursement — typically directly to the seller.</li>
</ol>

<h2 id="tips">Home Loan Tips for Nepal</h2>
<ul>
  <li>Compare rates from at least 3 banks before deciding.</li>
  <li>Negotiate the interest rate — banks have flexibility, especially for salaried customers.</li>
  <li>Consider fixing your rate for the first 3–5 years if rates are expected to rise.</li>
  <li>Make extra payments when possible — even NPR 5,000/month extra can save years off your loan.</li>
  <li>Ensure the property has clear title — bank will verify, but do your own due diligence too.</li>
  <li>Browse verified property listings on <strong>Thulo Bazaar</strong> to find houses and apartments within your loan-eligible range before visiting banks.</li>
</ul>`,

    content_ne: `<h2 id="home-loan-basics">नेपालमा गृह ऋण: आधारभूत कुरा</h2>
<p>काठमाडौँ उपत्यकामा घरको मूल्य रु ५० लाखदेखि ५ करोड+ सम्म हुने भएकाले अधिकांश खरिदकर्ताहरूलाई बैंक वित्तपोषण चाहिन्छ। नेपाली बैंकहरूले घर, अपार्टमेन्ट, जग्गा किन्न र घर नवीकरणका लागि गृह कर्जा प्रदान गर्छन्।</p>

<h2 id="interest-rates">गृह ऋण ब्याजदर २०२६</h2>
<ul>
  <li><strong>NIC Asia Bank:</strong> ९.५–११.५%।</li>
  <li><strong>Nabil Bank:</strong> १०–१२%।</li>
  <li><strong>NMB Bank:</strong> ९.८–११.८%।</li>
  <li><strong>Nepal Bank Limited:</strong> ९–११%।</li>
</ul>

<h2 id="emi-calculation">EMI गणना उदाहरण</h2>
<p>रु ५० लाख ऋण, १०.५% ब्याज, २० वर्ष: मासिक EMI लगभग रु ५०,२००।</p>

<h2 id="eligibility">योग्यता</h2>
<ul>
  <li>उमेर: २१–६० वर्ष। डाउन पेमेन्ट: सम्पत्ति मूल्यको २०–४०%।</li>
  <li>आय प्रमाण, नागरिकता, सम्पत्ति कागजात आवश्यक।</li>
</ul>

<h2 id="tips">गृह ऋण सुझावहरू</h2>
<ul>
  <li>कम्तीमा ३ बैंकबाट दर तुलना गर्नुहोस्।</li>
  <li>ब्याज दर मोलमोलाइ गर्नुहोस्।</li>
  <li>बैंक भ्रमण गर्नुअघि <strong>Thulo Bazaar</strong> मा तपाईंको ऋण दायरा भित्रका सम्पत्ति ब्राउज गर्नुहोस्।</li>
</ul>`,
    meta_description: 'Home loan guide for Nepal 2026: compare interest rates from NIC Asia, Nabil, NMB banks. EMI calculator, eligibility, and application process.',
    meta_description_ne: 'नेपालको गृह ऋण गाइड २०२६: NIC Asia, Nabil, NMB बैंकको ब्याजदर तुलना। EMI, योग्यता र आवेदन प्रक्रिया।',
    author_slug: 'hari-tamang',
    category_slug: 'property',
    tag_slugs: ['property-tips', 'price-guide'],
    reading_time_min: 6,
    linked_category_slugs: ['houses-for-sale'],
    is_featured: true,
  },

  // ── Post 3 ──────────────────────────────────────────────────────────────────
  {
    title: 'Chitwan Real Estate: Land & House Prices 2026',
    title_ne: 'चितवन रियल इस्टेट: जग्गा र घरको मूल्य २०२६',
    slug: 'chitwan-real-estate-land-house-prices',
    excerpt: 'Chitwan is one of Nepal\'s fastest-growing real estate markets. Get current land and house prices in Bharatpur, Narayanghat, Ratnanagar, and surrounding areas for 2026.',
    excerpt_ne: 'चितवन नेपालको सबैभन्दा तीव्र बढ्दो रियल इस्टेट बजार हो। भरतपुर, नारायणगढ, रत्ननगर र वरपरका क्षेत्रको २०२६ को जग्गा र घर मूल्य।',
    content: `<h2 id="why-chitwan">Why Chitwan Real Estate Is Booming</h2>
<p>Chitwan district, centred around Bharatpur Metropolitan City, has emerged as Nepal's second-most attractive real estate market after Kathmandu. The district offers flat terrain, good road connectivity (East-West Highway), proximity to tourism (Sauraha/Chitwan National Park), quality healthcare (Chitwan Medical College, Bharatpur Hospital), and education institutions. Many Nepalis are choosing Chitwan over Kathmandu for its cleaner air, lower prices, and better quality of life.</p>

<h2 id="land-prices">Land Prices in Chitwan 2026</h2>
<h3 id="bharatpur-core">Bharatpur Core (Narayanghat Area)</h3>
<ul>
  <li><strong>Commercial roadside:</strong> NPR 40–80 lakh per kattha along main highways.</li>
  <li><strong>Residential (inner roads):</strong> NPR 20–40 lakh per kattha.</li>
  <li><strong>Chaubiskothi, Pulchowk area:</strong> NPR 25–50 lakh per kattha.</li>
</ul>

<h3 id="ratnanagar">Ratnanagar/Sauraha Area</h3>
<ul>
  <li><strong>Near Sauraha (tourism zone):</strong> NPR 15–35 lakh per kattha for commercial potential.</li>
  <li><strong>Ratnanagar residential:</strong> NPR 10–20 lakh per kattha.</li>
</ul>

<h3 id="emerging-areas">Emerging/Affordable Areas</h3>
<ul>
  <li><strong>Meghauli, Madi:</strong> NPR 3–8 lakh per kattha — best for agricultural or long-term investment.</li>
  <li><strong>Kalyanpur, Khairhani:</strong> NPR 5–12 lakh per kattha — growing residential areas.</li>
  <li><strong>Rapti municipality areas:</strong> NPR 4–10 lakh per kattha.</li>
</ul>

<h2 id="house-prices">House Prices in Chitwan 2026</h2>
<ul>
  <li><strong>2.5-storey house in Bharatpur (5–8 kattha):</strong> NPR 1.5–3.5 crore.</li>
  <li><strong>New apartment (2BHK):</strong> NPR 35–60 lakh.</li>
  <li><strong>Budget house (outer Bharatpur):</strong> NPR 60 lakh–1.2 crore.</li>
  <li><strong>Bungalow/villa:</strong> NPR 2–5 crore in prime areas.</li>
</ul>

<h2 id="investment-potential">Investment Potential</h2>
<ul>
  <li>Land prices in Bharatpur have appreciated 15–25% annually over the past 5 years.</li>
  <li>Tourism-linked areas near Sauraha benefit from Nepal's growing tourism industry.</li>
  <li>Road infrastructure improvements (highway widening, ring road) are pushing prices up in previously affordable areas.</li>
  <li>Rental yields: 3–5% annually for residential, 5–8% for commercial in Narayanghat.</li>
</ul>

<h2 id="buying-tips">Tips for Buying Property in Chitwan</h2>
<ul>
  <li>Verify flood risk — some areas near the Narayani and Rapti rivers are flood-prone during monsoon.</li>
  <li>Check road access and municipality classification — affects future development potential.</li>
  <li>Use a local broker with Chitwan expertise, but always independently verify documents.</li>
  <li>Visit the Land Revenue Office (मालपोत) in Bharatpur to confirm ownership records.</li>
  <li>Browse property listings in Chitwan on <strong>Thulo Bazaar</strong> to compare prices across different areas before visiting in person.</li>
</ul>

<h2 id="chitwan-vs-kathmandu">Chitwan vs Kathmandu: Price Comparison</h2>
<p>A comparable house in Bharatpur costs 40–60% less than in Kathmandu Valley. A 2.5-storey house on 5 kattha in Bharatpur (NPR 1.5–2 crore) would cost NPR 3–5 crore in Lalitpur or Bhaktapur. For buyers working remotely or running location-independent businesses, Chitwan offers significantly better value. Find and compare properties across both locations on <strong>Thulo Bazaar</strong>.</p>`,

    content_ne: `<h2 id="why-chitwan">चितवन रियल इस्टेट किन बुम भइरहेको छ</h2>
<p>भरतपुर महानगरपालिकामा केन्द्रित चितवन जिल्ला काठमाडौँपछि नेपालको दोस्रो सबैभन्दा आकर्षक रियल इस्टेट बजारको रूपमा उदाएको छ। समतल भूभाग, राम्रो सडक सम्पर्क, पर्यटन, गुणस्तरीय स्वास्थ्य सेवा र शिक्षा संस्थाहरूले यसलाई आकर्षक बनाएको छ।</p>

<h2 id="land-prices">चितवनमा जग्गा मूल्य २०२६</h2>
<h3 id="bharatpur-core">भरतपुर कोर</h3>
<ul>
  <li>व्यावसायिक सडकछेउ: प्रति कट्ठा रु ४०–८० लाख।</li>
  <li>आवासीय: प्रति कट्ठा रु २०–४० लाख।</li>
</ul>
<h3 id="emerging-areas">उदीयमान क्षेत्रहरू</h3>
<ul>
  <li>मेघौली, मादी: प्रति कट्ठा रु ३–८ लाख।</li>
  <li>कल्याणपुर, खैरहनी: प्रति कट्ठा रु ५–१२ लाख।</li>
</ul>

<h2 id="house-prices">घर मूल्य</h2>
<ul>
  <li>भरतपुरमा 2.5 तल्ला: रु १.५–३.५ करोड।</li>
  <li>अपार्टमेन्ट (2BHK): रु ३५–६० लाख।</li>
</ul>

<h2 id="buying-tips">चितवनमा सम्पत्ति किन्ने सुझावहरू</h2>
<ul>
  <li>बाढी जोखिम जाँच्नुहोस् — केही क्षेत्रहरू बर्षातमा बाढी आउने छन्।</li>
  <li>सडक पहुँच र नगरपालिका वर्गीकरण जाँच्नुहोस्।</li>
  <li>व्यक्तिगत रूपमा भ्रमण गर्नुअघि <strong>Thulo Bazaar</strong> मा चितवनका सम्पत्ति सूचीहरू ब्राउज गर्नुहोस्।</li>
</ul>`,
    meta_description: 'Chitwan real estate prices 2026: land and house costs in Bharatpur, Narayanghat, Ratnanagar. Investment potential and buying tips.',
    meta_description_ne: 'चितवन रियल इस्टेट मूल्य २०२६: भरतपुर, नारायणगढ, रत्ननगरमा जग्गा र घरको लागत।',
    author_slug: 'hari-tamang',
    category_slug: 'property',
    tag_slugs: ['property-tips', 'real-estate', 'price-guide'],
    reading_time_min: 6,
    linked_category_slugs: ['land-for-sale', 'houses-for-sale'],
  },

  // ── Post 4 ──────────────────────────────────────────────────────────────────
  {
    title: 'Office Space Rent Kathmandu: Prices by Area',
    title_ne: 'अफिस स्पेस भाडा काठमाडौँ: क्षेत्र अनुसार मूल्य',
    slug: 'office-space-rent-kathmandu-prices-area',
    excerpt: 'Looking for office space in Kathmandu? Compare rental rates by area — from premium Durbar Marg to affordable Balaju. Includes co-working spaces and what to consider before signing a lease.',
    excerpt_ne: 'काठमाडौँमा अफिस स्पेस खोज्दै? प्रिमियम दरबार मार्गदेखि सस्तो बालाजुसम्म क्षेत्र अनुसार भाडा दर तुलना गर्नुहोस्।',
    content: `<h2 id="office-market">Office Space Market in Kathmandu 2026</h2>
<p>Kathmandu's office rental market serves startups, NGOs, IT companies, consulting firms, and growing businesses. The city's office landscape ranges from modern commercial towers in Durbar Marg and Hattisar to converted residential buildings in Lazimpat and Baluwatar. Understanding location-based pricing helps you find the right space within your budget.</p>

<h2 id="prices-by-area">Office Rent Prices by Area</h2>
<h3 id="premium">Premium Business Districts</h3>
<ul>
  <li><strong>Durbar Marg:</strong> NPR 50–100 per sq.ft/month. Prestigious address, walking distance to banks and embassies. Best for financial firms and corporate offices.</li>
  <li><strong>Hattisar/Kamaladi:</strong> NPR 40–80 per sq.ft/month. Good connectivity, commercial buildings.</li>
  <li><strong>New Baneshwor:</strong> NPR 35–65 per sq.ft/month. Growing commercial hub near government offices.</li>
</ul>

<h3 id="mid-range">Mid-Range Areas</h3>
<ul>
  <li><strong>Lazimpat/Baluwatar:</strong> NPR 30–55 per sq.ft/month. Popular with NGOs and diplomatic offices.</li>
  <li><strong>Thamel/Paknajol:</strong> NPR 25–50 per sq.ft/month. Tourist area with mixed commercial use.</li>
  <li><strong>Putalisadak:</strong> NPR 30–55 per sq.ft/month. IT and education hub.</li>
  <li><strong>Chabahil/Boudha:</strong> NPR 20–40 per sq.ft/month. Developing commercial area.</li>
</ul>

<h3 id="affordable">Affordable Areas</h3>
<ul>
  <li><strong>Balaju/Machhapokhari:</strong> NPR 15–30 per sq.ft/month. Industrial area with affordable commercial space.</li>
  <li><strong>Kalimati/Kalanki:</strong> NPR 15–30 per sq.ft/month. Good for warehousing and back-office operations.</li>
  <li><strong>Lalitpur (Jawalakhel, Pulchowk):</strong> NPR 25–45 per sq.ft/month. Growing tech hub with newer buildings.</li>
</ul>

<h2 id="coworking">Co-Working Spaces in Kathmandu</h2>
<p>If you don't need a full office, co-working spaces offer flexible options:</p>
<ul>
  <li><strong>Hot desk:</strong> NPR 5,000–12,000/month. Shared workspace with WiFi and amenities.</li>
  <li><strong>Dedicated desk:</strong> NPR 10,000–20,000/month. Your own fixed desk in a shared space.</li>
  <li><strong>Private cabin (2–4 people):</strong> NPR 25,000–50,000/month. Enclosed space within co-working facility.</li>
  <li>Popular co-working spaces: Impact Hub Kathmandu, Hult Prize Foundation spaces, and various options in Jhamsikhel and Patan.</li>
</ul>

<h2 id="what-to-check">What to Check Before Renting</h2>
<ul>
  <li><strong>Lease terms:</strong> Most require 1–3 year lease with 2–3 months advance deposit.</li>
  <li><strong>Maintenance charges:</strong> Some buildings charge NPR 5–15/sq.ft additional for maintenance, security, and common areas.</li>
  <li><strong>Parking:</strong> Crucial in Kathmandu — verify car and bike parking availability.</li>
  <li><strong>Internet connectivity:</strong> Check if fibre optic is available in the building.</li>
  <li><strong>Power backup:</strong> Essential — ask about generator/inverter provisions.</li>
  <li><strong>Building permits:</strong> Ensure the building has commercial use permit from the municipality.</li>
</ul>

<h2 id="find-office">Finding Office Space</h2>
<p>Browse commercial property listings on <strong>Thulo Bazaar</strong> to compare options across Kathmandu. Filter by area, size, and price to shortlist before visiting. Many landlords and brokers list their available spaces with photos, floor plans, and exact pricing on <strong>Thulo Bazaar</strong>.</p>`,

    content_ne: `<h2 id="office-market">काठमाडौँमा अफिस स्पेस बजार</h2>
<p>काठमाडौँको अफिस भाडा बजारले स्टार्टअप, NGO, IT कम्पनी र बढ्दो व्यापारहरूलाई सेवा दिन्छ। दरबार मार्गको आधुनिक टावरदेखि बालुवाटारको रूपान्तरित आवासीय भवनसम्म विकल्पहरू छन्।</p>

<h2 id="prices-by-area">क्षेत्र अनुसार भाडा दर</h2>
<h3 id="premium">प्रिमियम व्यापारिक जिल्ला</h3>
<ul>
  <li><strong>दरबार मार्ग:</strong> प्रति वर्ग फिट/महिना रु ५०–१००।</li>
  <li><strong>हात्तीसार:</strong> रु ४०–८०।</li>
  <li><strong>नयाँ बानेश्वर:</strong> रु ३५–६५।</li>
</ul>
<h3 id="affordable">सस्तो क्षेत्रहरू</h3>
<ul>
  <li><strong>बालाजु:</strong> रु १५–३०।</li>
  <li><strong>कलंकी:</strong> रु १५–३०।</li>
</ul>

<h2 id="coworking">को-वर्किङ स्पेस</h2>
<ul>
  <li>हट डेस्क: रु ५,०००–१२,०००/महिना।</li>
  <li>डेडिकेटेड डेस्क: रु १०,०००–२०,०००/महिना।</li>
</ul>

<h2 id="find-office">अफिस स्पेस खोज्ने</h2>
<p><strong>Thulo Bazaar</strong> मा व्यावसायिक सम्पत्ति सूचीहरू ब्राउज गर्नुहोस्। क्षेत्र, साइज र मूल्य अनुसार फिल्टर गर्नुहोस्।</p>`,
    meta_description: 'Office space rent in Kathmandu 2026: prices by area from Durbar Marg to Balaju. Co-working options and what to check before leasing.',
    meta_description_ne: 'काठमाडौँमा अफिस स्पेस भाडा २०२६: दरबार मार्गदेखि बालाजुसम्म क्षेत्र अनुसार मूल्य।',
    author_slug: 'hari-tamang',
    category_slug: 'property',
    tag_slugs: ['property-tips', 'kathmandu'],
    reading_time_min: 5,
    linked_category_slugs: ['commercial-property'],
  },

  // ── Post 5 ──────────────────────────────────────────────────────────────────
  {
    title: 'Property Registration Nepal: Rajaswa Process',
    title_ne: 'सम्पत्ति दर्ता नेपाल: राजस्व कार्यालय प्रक्रिया',
    slug: 'property-registration-nepal-rajaswa-process',
    excerpt: 'Step-by-step guide to registering property at Nepal\'s Land Revenue Office (Malpot/Rajaswa). Documents needed, registration fees, and tips to avoid delays.',
    excerpt_ne: 'नेपालको मालपोत/राजस्व कार्यालयमा सम्पत्ति दर्ता गर्ने चरणबद्ध गाइड। आवश्यक कागजपत्र, दर्ता शुल्क र ढिलाइ नहोस् भन्ने सुझावहरू।',
    content: `<h2 id="what-is-registration">What Is Property Registration in Nepal?</h2>
<p>Property registration (रजिस्ट्रेसन) is the legal process of transferring land or building ownership from seller to buyer at the Land Revenue Office (मालपोत कार्यालय / राजस्व कार्यालय). Until registration is complete, ownership does not legally transfer — regardless of any private agreement or payment made. This makes understanding the registration process essential for any property transaction in Nepal.</p>

<h2 id="documents-needed">Documents Required</h2>
<h3 id="seller-docs">From the Seller</h3>
<ul>
  <li>Original लालपुर्जा (land ownership certificate).</li>
  <li>नागरिकता (citizenship certificate).</li>
  <li>Property tax clearance certificate (कर चुक्ता).</li>
  <li>4 passport-size photos.</li>
  <li>If joint ownership: consent letters from all owners.</li>
  <li>If inherited property: succession documents (हकवाला प्रमाणपत्र).</li>
</ul>

<h3 id="buyer-docs">From the Buyer</h3>
<ul>
  <li>नागरिकता (citizenship certificate).</li>
  <li>4 passport-size photos.</li>
  <li>PAN card (for registration fee payment).</li>
  <li>If buying through a company: company registration documents, board resolution.</li>
</ul>

<h2 id="registration-fees">Registration Fees and Taxes</h2>
<ul>
  <li><strong>Registration fee:</strong> 4–6% of the government-evaluated property value (not the market price). Rates vary by municipality zone.</li>
  <li><strong>Capital gains tax (seller):</strong> 5% of profit if property held less than 5 years; 2.5% if held longer.</li>
  <li><strong>Stamp duty:</strong> NPR 100–500.</li>
  <li><strong>Service charges:</strong> NPR 200–1,000 for processing.</li>
</ul>
<p>Note: Government property valuations are often lower than market prices, so the effective tax rate on the actual transaction amount is lower.</p>

<h2 id="step-by-step">Step-by-Step Registration Process</h2>
<ol>
  <li><strong>Agreement between parties:</strong> Buyer and seller agree on price and terms. Many people find each other through <strong>Thulo Bazaar</strong> property listings.</li>
  <li><strong>Visit the Land Revenue Office:</strong> Both buyer and seller must be present with all documents. Alternatively, a legally authorized representative (मुख्तियारनामा holder) can represent either party.</li>
  <li><strong>Document verification:</strong> Office staff verify ownership records, check for liens or disputes, and confirm tax clearance.</li>
  <li><strong>Valuation:</strong> The office assesses property value based on government rates for the area.</li>
  <li><strong>Fee calculation and payment:</strong> Registration fee is calculated and must be paid at a designated bank (typically Rastriya Banijya Bank or other government-approved bank).</li>
  <li><strong>Registration entry:</strong> Upon payment confirmation, the transfer is entered in the land records.</li>
  <li><strong>New लालपुर्जा issued:</strong> A new ownership certificate in the buyer's name is issued. This typically takes 1–7 working days depending on the office.</li>
</ol>

<h2 id="common-issues">Common Issues and How to Avoid Them</h2>
<ul>
  <li><strong>Boundary disputes:</strong> Get a surveyor to verify boundaries before registration.</li>
  <li><strong>Unpaid taxes:</strong> Ensure all property taxes are cleared — the office will reject registration otherwise.</li>
  <li><strong>Court stays:</strong> Check if the property has any court case (मुद्दा) pending — the Land Revenue Office cannot register such properties.</li>
  <li><strong>Incorrect documents:</strong> Any mismatch between citizenship name and लालपुर्जा name causes delays. Correct before visiting.</li>
  <li><strong>Brokers:</strong> While brokers facilitate the process, ensure you understand each step yourself to avoid fraud.</li>
</ul>

<h2 id="tips">Tips for Smooth Registration</h2>
<ul>
  <li>Visit the Land Revenue Office early morning — queues build up quickly.</li>
  <li>Bring photocopies of all documents (multiple sets).</li>
  <li>Check government property valuation rates beforehand to estimate registration costs.</li>
  <li>When buying property found through <strong>Thulo Bazaar</strong>, always conduct independent legal verification before proceeding to registration.</li>
</ul>`,

    content_ne: `<h2 id="what-is-registration">सम्पत्ति दर्ता के हो?</h2>
<p>सम्पत्ति दर्ता (रजिस्ट्रेसन) मालपोत कार्यालयमा विक्रेताबाट खरिदकर्तामा जग्गा वा भवनको स्वामित्व हस्तान्तरण गर्ने कानुनी प्रक्रिया हो। दर्ता नसकिएसम्म स्वामित्व कानुनी रूपमा हस्तान्तरण हुँदैन।</p>

<h2 id="documents-needed">आवश्यक कागजपत्र</h2>
<h3 id="seller-docs">विक्रेताबाट</h3>
<ul>
  <li>मूल लालपुर्जा, नागरिकता, कर चुक्ता प्रमाणपत्र, ४ फोटो।</li>
</ul>
<h3 id="buyer-docs">खरिदकर्ताबाट</h3>
<ul>
  <li>नागरिकता, ४ फोटो, PAN कार्ड।</li>
</ul>

<h2 id="registration-fees">दर्ता शुल्क र कर</h2>
<ul>
  <li>दर्ता शुल्क: सरकारी मूल्याङ्कनको ४–६%।</li>
  <li>पूँजीगत लाभ कर: ५ वर्षभन्दा कम राखे ५%, बढी राखे २.५%।</li>
</ul>

<h2 id="step-by-step">चरणबद्ध प्रक्रिया</h2>
<ol>
  <li>खरिदकर्ता र विक्रेता बीच सम्झौता। <strong>Thulo Bazaar</strong> मा सम्पत्ति भेटिन्छ।</li>
  <li>दुवै पक्ष कागजातसहित मालपोत कार्यालय जानुपर्छ।</li>
  <li>कागजात प्रमाणीकरण र मूल्याङ्कन।</li>
  <li>बैंकमा शुल्क भुक्तानी।</li>
  <li>जग्गा रेकर्डमा हस्तान्तरण प्रविष्टि।</li>
  <li>नयाँ लालपुर्जा जारी — सामान्यतः १–७ कार्य दिन।</li>
</ol>

<h2 id="tips">सुझावहरू</h2>
<ul>
  <li>बिहान सबेरै मालपोत कार्यालय जानुहोस्।</li>
  <li>सबै कागजातका धेरै फोटोकपी ल्याउनुहोस्।</li>
  <li><strong>Thulo Bazaar</strong> मा भेटिएको सम्पत्ति किन्दा दर्ता गर्नुअघि स्वतन्त्र कानुनी प्रमाणीकरण गर्नुहोस्।</li>
</ul>`,
    meta_description: 'Property registration in Nepal: step-by-step Rajaswa/Malpot process, documents needed, fees, and tips for smooth ownership transfer.',
    meta_description_ne: 'नेपालमा सम्पत्ति दर्ता: मालपोत/राजस्व प्रक्रिया, आवश्यक कागजपत्र, शुल्क र सुझावहरू।',
    author_slug: 'hari-tamang',
    category_slug: 'property',
    tag_slugs: ['property-tips', 'nepal-market'],
    reading_time_min: 6,
    linked_category_slugs: ['land-for-sale'],
  },
];

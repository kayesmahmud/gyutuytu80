import { prisma } from '../src/client';
import { vehiclesPosts } from './blog-posts/vehicles-posts';
import { mobilesPosts } from './blog-posts/mobiles-posts';
import { electronicsPosts } from './blog-posts/electronics-posts';
import { propertyPosts } from './blog-posts/property-posts';
import { lifestylePosts } from './blog-posts/lifestyle-posts';

// Spread published_at dates over the past 6 months for natural SEO appearance
function randomDateInPast6Months(): Date {
  const now = Date.now();
  const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;
  return new Date(now - Math.random() * SIX_MONTHS_MS);
}

async function main() {
  console.log('Seeding 100 blog posts...\n');

  // ── Authors ──────────────────────────────────────────────
  const authorData = [
    {
      slug: 'rajesh-shrestha',
      name: 'Rajesh Shrestha',
      name_ne: 'राजेश श्रेष्ठ',
      bio: "Rajesh is a seasoned automotive journalist with over 12 years of experience covering Nepal's vehicle market.",
      bio_ne: 'राजेश नेपालको सवारी साधन बजारमा १२ वर्षभन्दा बढी अनुभव भएका अटोमोटिभ पत्रकार हुन्।',
      credentials: 'Automotive Expert, 12+ years in Nepal market',
      credentials_ne: 'अटोमोटिभ विशेषज्ञ, नेपाल बजारमा १२+ वर्ष',
      expertise_areas: ['cars', 'motorbikes', 'electric-vehicles'],
      social_links: { facebook: 'https://facebook.com/rajesh.automotive' },
    },
    {
      slug: 'sita-gurung',
      name: 'Sita Gurung',
      name_ne: 'सीता गुरुङ',
      bio: 'Sita is a tech reviewer and gadget enthusiast based in Kathmandu. She specializes in mobile phones, laptops, and consumer electronics.',
      bio_ne: 'सीता काठमाडौँमा रहेर काम गर्ने टेक रिभ्युअर र ग्याजेट उत्साही हुन्।',
      credentials: 'Tech Reviewer, Consumer Electronics Specialist',
      credentials_ne: 'टेक रिभ्युअर, उपभोक्ता इलेक्ट्रोनिक्स विशेषज्ञ',
      expertise_areas: ['mobiles', 'laptops', 'electronics'],
      social_links: { facebook: 'https://facebook.com/sita.tech', linkedin: 'https://linkedin.com/in/sitagurung' },
    },
    {
      slug: 'hari-tamang',
      name: 'Hari Tamang',
      name_ne: 'हरि तामाङ',
      bio: "Hari is a real estate consultant and property market analyst with deep knowledge of Nepal's housing sector.",
      bio_ne: 'हरि रियल इस्टेट सल्लाहकार र सम्पत्ति बजार विश्लेषक हुन्।',
      credentials: 'Real Estate Consultant, Property Market Analyst',
      credentials_ne: 'रियल इस्टेट सल्लाहकार, सम्पत्ति बजार विश्लेषक',
      expertise_areas: ['property', 'real-estate', 'land'],
      social_links: { facebook: 'https://facebook.com/hari.realestate' },
    },
    {
      slug: 'anita-maharjan',
      name: 'Anita Maharjan',
      name_ne: 'अनिता महर्जन',
      bio: 'Anita is a consumer safety advocate and online marketplace expert. She writes about scam prevention and safe buying practices.',
      bio_ne: 'अनिता उपभोक्ता सुरक्षा अधिवक्ता र अनलाइन बजार विशेषज्ञ हुन्।',
      credentials: 'Consumer Safety Advocate, Online Marketplace Expert',
      credentials_ne: 'उपभोक्ता सुरक्षा अधिवक्ता, अनलाइन बजार विशेषज्ञ',
      expertise_areas: ['safety', 'scam-prevention', 'general'],
      social_links: { facebook: 'https://facebook.com/anita.consumer' },
    },
    {
      slug: 'priya-shrestha',
      name: 'Priya Shrestha',
      name_ne: 'प्रिया श्रेष्ठ',
      bio: 'Priya is a lifestyle blogger and fashion enthusiast covering trends in home décor, fashion, and modern living in Nepal.',
      bio_ne: 'प्रिया जीवनशैली ब्लगर र फेसन उत्साही हुन् जसले नेपालमा गृह सजावट, फेसन र आधुनिक जीवनशैलीबारे लेख्छिन्।',
      credentials: 'Lifestyle Blogger, Fashion & Home Décor Expert',
      credentials_ne: 'जीवनशैली ब्लगर, फेसन र गृह सजावट विशेषज्ञ',
      expertise_areas: ['fashion', 'home-living', 'lifestyle'],
      social_links: { facebook: 'https://facebook.com/priya.lifestyle' },
    },
    {
      slug: 'bikram-rai',
      name: 'Bikram Rai',
      name_ne: 'बिक्रम राई',
      bio: 'Bikram is a career coach and classifieds expert helping Nepali job seekers and entrepreneurs navigate the marketplace.',
      bio_ne: 'बिक्रम करियर कोच र क्लासिफाइड विशेषज्ञ हुन् जसले नेपाली रोजगारीचाहनेहरूलाई मद्दत गर्छन्।',
      credentials: 'Career Coach, Classifieds Expert',
      credentials_ne: 'करियर कोच, क्लासिफाइड विशेषज्ञ',
      expertise_areas: ['jobs', 'services', 'general'],
      social_links: { facebook: 'https://facebook.com/bikram.careers' },
    },
  ];

  const authors = await Promise.all(
    authorData.map(a =>
      prisma.blog_authors.upsert({
        where: { slug: a.slug },
        update: {},
        create: a,
      })
    )
  );
  console.log(`✅ ${authors.length} authors ready`);

  // ── Categories ───────────────────────────────────────────
  const categoryData = [
    { slug: 'vehicles', name: 'Vehicles', name_ne: 'सवारी साधन', description: 'Tips and guides for buying and selling cars, motorbikes, and other vehicles in Nepal.', description_ne: 'नेपालमा कार, मोटरसाइकल र अन्य सवारी साधन किन्ने र बेच्ने टिप्स।', display_order: 1 },
    { slug: 'electronics', name: 'Electronics', name_ne: 'इलेक्ट्रोनिक्स', description: 'Guides for buying and selling electronics and gadgets in Nepal.', description_ne: 'नेपालमा इलेक्ट्रोनिक्स र ग्याजेटहरू किन्ने र बेच्ने गाइडहरू।', display_order: 2 },
    { slug: 'mobiles', name: 'Mobiles', name_ne: 'मोबाइल', description: 'Mobile phone guides, reviews, and buying tips for Nepal.', description_ne: 'नेपालका लागि मोबाइल फोन गाइडहरू, समीक्षा र किन्ने टिप्स।', display_order: 3 },
    { slug: 'property', name: 'Property', name_ne: 'सम्पत्ति', description: 'Real estate tips, property buying guides, and market trends in Nepal.', description_ne: 'नेपालमा रियल इस्टेट टिप्स, सम्पत्ति किन्ने गाइड र बजार प्रवृत्तिहरू।', display_order: 4 },
    { slug: 'safety-tips', name: 'Safety Tips', name_ne: 'सुरक्षा टिप्स', description: 'How to avoid scams and stay safe when buying and selling online in Nepal.', description_ne: 'नेपालमा अनलाइन किनबेच गर्दा ठगीबाट बच्ने तरिकाहरू।', display_order: 5 },
    { slug: 'buying-guides', name: 'Buying Guides', name_ne: 'किन्ने गाइड', description: 'Comprehensive buying guides for all product categories in Nepal.', description_ne: 'नेपालमा सबै उत्पादन श्रेणीहरूको लागि विस्तृत किन्ने गाइडहरू।', display_order: 6 },
    { slug: 'jobs-careers', name: 'Jobs & Careers', name_ne: 'रोजगार र करियर', description: 'Job search tips, career advice, and employment guides for Nepal.', description_ne: 'नेपालका लागि रोजगारी खोज टिप्स, करियर सल्लाह र रोजगार गाइडहरू।', display_order: 7 },
    { slug: 'fashion-lifestyle', name: 'Fashion & Lifestyle', name_ne: 'फेसन र जीवनशैली', description: 'Fashion trends, lifestyle tips, and shopping guides for Nepal.', description_ne: 'नेपालका लागि फेसन ट्रेन्ड, जीवनशैली टिप्स र शपिङ गाइडहरू।', display_order: 8 },
    { slug: 'pets-animals', name: 'Pets & Animals', name_ne: 'पशुपन्छी', description: 'Pet care tips, buying guides, and animal welfare in Nepal.', description_ne: 'नेपालमा पशुपन्छी हेरचाह टिप्स, किन्ने गाइड र पशु कल्याण।', display_order: 9 },
    { slug: 'home-living', name: 'Home & Living', name_ne: 'घर र जीवनशैली', description: 'Home décor, furniture buying, and living tips for Nepal.', description_ne: 'नेपालका लागि गृह सजावट, फर्निचर किन्ने र जीवनशैली टिप्स।', display_order: 10 },
  ];

  const categories = await Promise.all(
    categoryData.map(c =>
      prisma.blog_categories.upsert({
        where: { slug: c.slug },
        update: {},
        create: c,
      })
    )
  );
  console.log(`✅ ${categories.length} blog categories ready`);

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
    // New tags
    { name: 'Land', name_ne: 'जग्गा', slug: 'land' },
    { name: 'Apartments', name_ne: 'अपार्टमेन्ट', slug: 'apartments' },
    { name: 'House Rental', name_ne: 'घर भाडा', slug: 'house-rental' },
    { name: 'Real Estate', name_ne: 'रियल इस्टेट', slug: 'real-estate' },
    { name: 'TVs', name_ne: 'टिभी', slug: 'tvs' },
    { name: 'Home Appliances', name_ne: 'घरेलु उपकरण', slug: 'home-appliances' },
    { name: 'Wearables', name_ne: 'वेयरेबल', slug: 'wearables' },
    { name: 'Tablets', name_ne: 'ट्याब्लेट', slug: 'tablets' },
    { name: 'Desktop Computers', name_ne: 'डेस्कटप कम्प्युटर', slug: 'desktop-computers' },
    { name: 'Trucks', name_ne: 'ट्रक', slug: 'trucks' },
    { name: 'Bicycles', name_ne: 'साइकल', slug: 'bicycles' },
    { name: 'Fashion', name_ne: 'फेसन', slug: 'fashion' },
    { name: 'Pets', name_ne: 'पशुपन्छी', slug: 'pets' },
    { name: 'Jobs', name_ne: 'रोजगार', slug: 'jobs' },
    { name: 'Home Living', name_ne: 'घर बसाइ', slug: 'home-living' },
    { name: 'Accessories', name_ne: 'एक्सेसरीज', slug: 'accessories' },
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
  console.log(`✅ ${tags.length} tags ready`);

  // ── Lookup maps ──────────────────────────────────────────
  const authorMap = new Map(authors.map(a => [a.slug, a]));
  const catMap = new Map(categories.map(c => [c.slug, c]));
  const tagMap = new Map(tags.map(t => [t.slug, t]));

  // ── All posts ────────────────────────────────────────────
  const allPosts = [
    ...vehiclesPosts,
    ...mobilesPosts,
    ...electronicsPosts,
    ...propertyPosts,
    ...lifestylePosts,
  ];

  console.log(`\nProcessing ${allPosts.length} posts...\n`);

  let created = 0;
  let skipped = 0;

  for (const postData of allPosts) {
    const existing = await prisma.blog_posts.findUnique({ where: { slug: postData.slug } });
    if (existing) {
      skipped++;
      continue;
    }

    const author = authorMap.get(postData.author_slug);
    const category = catMap.get(postData.category_slug);

    if (!author) {
      console.error(`  ❌ Author not found: ${postData.author_slug} (post: ${postData.slug})`);
      continue;
    }
    if (!category) {
      console.error(`  ❌ Category not found: ${postData.category_slug} (post: ${postData.slug})`);
      continue;
    }

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
        is_featured: postData.is_featured || false,
        published_at: randomDateInPast6Months(),
        linked_category_slugs: postData.linked_category_slugs,
      },
    });

    // Tag associations
    const postTagSlugs = postData.tag_slugs || [];
    for (const slug of postTagSlugs) {
      const tag = tagMap.get(slug);
      if (tag) {
        await prisma.blog_post_tags.create({
          data: { post_id: post.id, tag_id: tag.id },
        });
      } else {
        console.warn(`  ⚠️  Tag not found: ${slug} (post: ${postData.slug})`);
      }
    }

    created++;
    if (created % 10 === 0) console.log(`  ... ${created} posts created`);
  }

  console.log(`\n✅ Created ${created} new posts (${skipped} already existed)`);

  const total = await prisma.blog_posts.count({ where: { status: 'published' } });
  console.log(`📊 Total published blog posts: ${total}`);
  console.log('\n🎉 Blog seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

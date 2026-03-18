import { prisma } from '../src/client';
import { fashionPosts } from './blog-posts/fashion-posts';
import { petsPosts } from './blog-posts/pets-posts';
import { servicesJobsPosts } from './blog-posts/services-jobs-posts';
import { homeLivingPosts } from './blog-posts/home-living-posts';
import { hobbiesSportsPosts } from './blog-posts/hobbies-sports-posts';
import { businessIndustryPosts } from './blog-posts/business-industry-posts';
import { agriculturePosts } from './blog-posts/agriculture-posts';
import { essentialsPosts } from './blog-posts/essentials-posts';
import { vehiclesNewPosts } from './blog-posts/vehicles-new-posts';
import { electronicsNewPosts } from './blog-posts/electronics-new-posts';
import { propertyNewPosts } from './blog-posts/property-new-posts';
import { mobilesNewPosts } from './blog-posts/mobiles-new-posts';

// Spread published_at dates over the past 6 months for natural SEO appearance
function randomDateInPast6Months(): Date {
  const now = Date.now();
  const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;
  return new Date(now - Math.random() * SIX_MONTHS_MS);
}

async function main() {
  console.log('Seeding 100 NEW blog posts (batch 2)...\n');

  // ── New Authors ──────────────────────────────────────────
  const newAuthorData = [
    {
      slug: 'deepak-thapa',
      name: 'Deepak Thapa',
      name_ne: 'दीपक थापा',
      bio: 'Deepak is a business consultant and industrial equipment expert with 15 years of experience in Nepal\'s manufacturing and construction sectors.',
      bio_ne: 'दीपक नेपालको उत्पादन र निर्माण क्षेत्रमा १५ वर्षको अनुभव भएका व्यापार सल्लाहकार र औद्योगिक उपकरण विशेषज्ञ हुन्।',
      credentials: 'Business Consultant, Industrial Equipment Expert',
      credentials_ne: 'व्यापार सल्लाहकार, औद्योगिक उपकरण विशेषज्ञ',
      expertise_areas: ['business', 'industry', 'construction'],
      social_links: { facebook: 'https://facebook.com/deepak.business' },
    },
    {
      slug: 'kamala-devi',
      name: 'Kamala Devi Sharma',
      name_ne: 'कमला देवी शर्मा',
      bio: 'Kamala is an agriculture specialist and rural economy researcher. She writes about modern farming techniques, livestock management, and agricultural markets in Nepal.',
      bio_ne: 'कमला कृषि विशेषज्ञ र ग्रामीण अर्थतन्त्र अनुसन्धानकर्ता हुन्। उनी नेपालमा आधुनिक कृषि प्रविधि, पशुपालन व्यवस्थापन र कृषि बजारबारे लेख्छिन्।',
      credentials: 'Agriculture Specialist, Rural Economy Researcher',
      credentials_ne: 'कृषि विशेषज्ञ, ग्रामीण अर्थतन्त्र अनुसन्धानकर्ता',
      expertise_areas: ['agriculture', 'livestock', 'farming'],
      social_links: { facebook: 'https://facebook.com/kamala.agriculture' },
    },
  ];

  const authors = await Promise.all(
    newAuthorData.map(a =>
      prisma.blog_authors.upsert({
        where: { slug: a.slug },
        update: {},
        create: a,
      })
    )
  );
  console.log(`✅ ${authors.length} new authors ready`);

  // Also fetch existing authors for reference
  const allAuthors = await prisma.blog_authors.findMany();
  console.log(`  (${allAuthors.length} total authors in DB)`);

  // ── New Categories ─────────────────────────────────────
  const newCategoryData = [
    { slug: 'services', name: 'Services', name_ne: 'सेवाहरू', description: 'Find and hire services in Nepal — tuition, repair, IT, beauty, fitness, and domestic help.', description_ne: 'नेपालमा सेवाहरू खोज्नुहोस् — ट्युसन, मर्मत, IT, ब्यूटी, फिटनेस र घरेलु सहायता।', display_order: 11 },
    { slug: 'hobbies-sports', name: 'Hobbies & Sports', name_ne: 'शौक र खेलकुद', description: 'Guides for sports equipment, musical instruments, books, toys, and hobby gear in Nepal.', description_ne: 'नेपालमा खेलकुद सामान, वाद्ययन्त्र, किताब, खेलौना र शौक सामानका गाइडहरू।', display_order: 12 },
    { slug: 'business-industry', name: 'Business & Industry', name_ne: 'व्यापार र उद्योग', description: 'Industrial machinery, office equipment, medical supplies, and business resources in Nepal.', description_ne: 'नेपालमा औद्योगिक मेसिनरी, अफिस उपकरण, मेडिकल सामान र व्यापारिक स्रोतहरू।', display_order: 13 },
    { slug: 'agriculture', name: 'Agriculture', name_ne: 'कृषि', description: 'Farming tools, fertilizers, livestock, crops, and agricultural guides for Nepal.', description_ne: 'नेपालका लागि कृषि उपकरण, मल, पशुपालन, बाली र कृषि गाइडहरू।', display_order: 14 },
    { slug: 'essentials', name: 'Essentials', name_ne: 'आवश्यक सामान', description: 'Baby products, healthcare, grocery, and household essentials buying guides for Nepal.', description_ne: 'नेपालका लागि शिशु सामान, स्वास्थ्य, किराना र घरेलु आवश्यक सामान किन्ने गाइडहरू।', display_order: 15 },
  ];

  const categories = await Promise.all(
    newCategoryData.map(c =>
      prisma.blog_categories.upsert({
        where: { slug: c.slug },
        update: {},
        create: c,
      })
    )
  );
  console.log(`✅ ${categories.length} new blog categories ready`);

  // Fetch all categories
  const allCategories = await prisma.blog_categories.findMany();
  console.log(`  (${allCategories.length} total categories in DB)`);

  // ── New Tags ───────────────────────────────────────────
  const newTagData = [
    { name: 'Services', name_ne: 'सेवाहरू', slug: 'services' },
    { name: 'Agriculture', name_ne: 'कृषि', slug: 'agriculture' },
    { name: 'Fitness', name_ne: 'फिटनेस', slug: 'fitness' },
    { name: 'Sports', name_ne: 'खेलकुद', slug: 'sports' },
    { name: 'Kids', name_ne: 'बच्चाहरू', slug: 'kids' },
    { name: 'Business', name_ne: 'व्यापार', slug: 'business' },
    { name: 'Machinery', name_ne: 'मेसिनरी', slug: 'machinery' },
    { name: 'Grooming', name_ne: 'ग्रुमिङ', slug: 'grooming' },
    { name: 'Beauty', name_ne: 'सौन्दर्य', slug: 'beauty' },
    { name: 'Musical Instruments', name_ne: 'वाद्ययन्त्र', slug: 'musical-instruments' },
    { name: 'Books', name_ne: 'किताब', slug: 'books' },
    { name: 'Essentials', name_ne: 'आवश्यक सामान', slug: 'essentials' },
    { name: 'Baby Products', name_ne: 'शिशु सामान', slug: 'baby-products' },
    { name: 'Livestock', name_ne: 'पशुपालन', slug: 'livestock' },
    { name: 'Overseas Jobs', name_ne: 'विदेशी रोजगार', slug: 'overseas-jobs' },
    { name: 'Tuition', name_ne: 'ट्युसन', slug: 'tuition' },
    { name: 'Domestic Help', name_ne: 'घरेलु सहायता', slug: 'domestic-help' },
    { name: 'Men Fashion', name_ne: 'पुरुष फेसन', slug: 'men-fashion' },
    { name: 'Women Fashion', name_ne: 'महिला फेसन', slug: 'women-fashion' },
    { name: 'Jewelry', name_ne: 'गहना', slug: 'jewelry' },
    { name: 'Skincare', name_ne: 'छाला हेरचाह', slug: 'skincare' },
    { name: 'Trekking', name_ne: 'ट्रेकिङ', slug: 'trekking' },
    { name: 'Farming', name_ne: 'कृषि कार्य', slug: 'farming' },
    { name: 'Vehicles', name_ne: 'सवारी साधन', slug: 'vehicles' },
  ];

  const newTags = await Promise.all(
    newTagData.map(t =>
      prisma.blog_tags.upsert({
        where: { slug: t.slug },
        update: {},
        create: t,
      })
    )
  );
  console.log(`✅ ${newTags.length} new tags ready`);

  // Fetch all tags
  const allTags = await prisma.blog_tags.findMany();
  console.log(`  (${allTags.length} total tags in DB)`);

  // ── Lookup maps ──────────────────────────────────────────
  const authorMap = new Map(allAuthors.map(a => [a.slug, a]));
  const catMap = new Map(allCategories.map(c => [c.slug, c]));
  const tagMap = new Map(allTags.map(t => [t.slug, t]));

  // ── All new posts ──────────────────────────────────────
  const allPosts = [
    ...fashionPosts,
    ...petsPosts,
    ...servicesJobsPosts,
    ...homeLivingPosts,
    ...hobbiesSportsPosts,
    ...businessIndustryPosts,
    ...agriculturePosts,
    ...essentialsPosts,
    ...vehiclesNewPosts,
    ...electronicsNewPosts,
    ...propertyNewPosts,
    ...mobilesNewPosts,
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
  console.log('\n🎉 Blog seeding batch 2 complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

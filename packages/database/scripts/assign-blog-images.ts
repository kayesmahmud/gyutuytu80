import { prisma } from '../src/client';

/**
 * Assigns Unsplash featured images to all blog posts that don't have one.
 * Images are curated per blog-category and rotated across posts.
 *
 * Unsplash license: free for commercial use, no attribution required (but appreciated).
 * Format: https://images.unsplash.com/photo-{id}?w=800&h=450&fit=crop&q=80
 */

const BASE = 'https://images.unsplash.com';
const PARAMS = '?w=800&h=450&fit=crop&q=80';

const imagePool: Record<string, string[]> = {
  vehicles: [
    `${BASE}/photo-1492144534655-ae79c964c9d7${PARAMS}`,   // red sports car
    `${BASE}/photo-1449824913935-59a10b8d2000${PARAMS}`,   // city traffic
    `${BASE}/photo-1503376780353-7e6692767b70${PARAMS}`,   // car on road
    `${BASE}/photo-1558618666-fcd25c85f82e${PARAMS}`,     // motorbike
    `${BASE}/photo-1568605117036-5fe5e7bab0b0${PARAMS}`,   // car interior
    `${BASE}/photo-1533473359331-2f2db1c59548${PARAMS}`,   // motorcycle close-up
    `${BASE}/photo-1485291571150-772bcfc10da5${PARAMS}`,   // highway driving
  ],
  mobiles: [
    `${BASE}/photo-1511707171634-5f897ff02aa6${PARAMS}`,   // smartphone on desk
    `${BASE}/photo-1512941937669-90a1b58e7e9c${PARAMS}`,   // phone in hand
    `${BASE}/photo-1601784551446-20c9e07cdbdb${PARAMS}`,   // phones lineup
    `${BASE}/photo-1585060544812-6b45742d762f${PARAMS}`,   // phone store display
    `${BASE}/photo-1598327105666-5b89351aff97${PARAMS}`,   // phone accessories
  ],
  electronics: [
    `${BASE}/photo-1496181133206-80ce9b88a853${PARAMS}`,   // laptop on desk
    `${BASE}/photo-1518770660439-4636190af475${PARAMS}`,   // electronics board
    `${BASE}/photo-1593642632559-0c6d3fc62b89${PARAMS}`,   // modern TV
    `${BASE}/photo-1550009158-9ebf69173e03${PARAMS}`,     // appliances
    `${BASE}/photo-1588872657578-7efd1f1555ed${PARAMS}`,   // laptop work
    `${BASE}/photo-1526738549149-8e07eca6c147${PARAMS}`,   // camera gear
  ],
  property: [
    `${BASE}/photo-1560518883-ce09059eeffa${PARAMS}`,     // house for sale
    `${BASE}/photo-1564013799919-ab600027ffc6${PARAMS}`,   // modern house
    `${BASE}/photo-1502672260266-1c1ef2d93688${PARAMS}`,   // living room
    `${BASE}/photo-1560448204-e02f11c3d0e2${PARAMS}`,     // apartment building
    `${BASE}/photo-1570129477492-45c003edd2be${PARAMS}`,   // house exterior
    `${BASE}/photo-1600585154340-be6161a56a0c${PARAMS}`,   // real estate
  ],
  'safety-tips': [
    `${BASE}/photo-1563013544-824ae1b704d3${PARAMS}`,     // padlock security
    `${BASE}/photo-1555949963-ff9fe0c870eb${PARAMS}`,     // online security
    `${BASE}/photo-1614064641938-3bbee52942c7${PARAMS}`,   // shield concept
    `${BASE}/photo-1550751827-4bd374c3f58b${PARAMS}`,     // cyber security
  ],
  'buying-guides': [
    `${BASE}/photo-1556742049-0cfed4f6a45d${PARAMS}`,     // shopping
    `${BASE}/photo-1472851294608-062f824d29cc${PARAMS}`,   // shopping bags
    `${BASE}/photo-1556742111-a301076d9d18${PARAMS}`,     // customer shopping
    `${BASE}/photo-1607083206869-4c7672e72a8a${PARAMS}`,   // online shopping
  ],
  'jobs-careers': [
    `${BASE}/photo-1521737711867-e3b97375f902${PARAMS}`,   // team meeting
    `${BASE}/photo-1507679799987-c73779587ccf${PARAMS}`,   // business professional
    `${BASE}/photo-1454165804606-c3d57bc86b40${PARAMS}`,   // desk work
    `${BASE}/photo-1573497019940-1c28c88b4f3e${PARAMS}`,   // professional woman
  ],
  'fashion-lifestyle': [
    `${BASE}/photo-1445205170230-053b83016050${PARAMS}`,   // fashion
    `${BASE}/photo-1558171813-4c088753af8f${PARAMS}`,     // clothing rack
    `${BASE}/photo-1490481651871-ab68de25d43d${PARAMS}`,   // style accessories
    `${BASE}/photo-1469334031218-e382a71b716b${PARAMS}`,   // fashion model
  ],
  'pets-animals': [
    `${BASE}/photo-1450778869180-41d0601e0e36${PARAMS}`,   // happy dog
    `${BASE}/photo-1514888286974-6c03e2ca1dba${PARAMS}`,   // cat face
    `${BASE}/photo-1425082661705-1834bfd09dca${PARAMS}`,   // golden puppy
    `${BASE}/photo-1573865526739-10659fec78a5${PARAMS}`,   // cat sitting
  ],
  'home-living': [
    `${BASE}/photo-1586023492125-27b2c045efd7${PARAMS}`,   // modern living room
    `${BASE}/photo-1556909114-f6e7ad7d3136${PARAMS}`,     // bedroom design
    `${BASE}/photo-1556228453-efd6c1ff04f6${PARAMS}`,     // kitchen interior
    `${BASE}/photo-1555041469-a586c61ea9bc${PARAMS}`,     // furniture
  ],
};

async function main() {
  console.log('Assigning featured images to blog posts...\n');

  // Get all posts without featured images, joined with their category
  const posts = await prisma.blog_posts.findMany({
    where: { featured_image: null },
    select: {
      id: true,
      slug: true,
      title: true,
      blog_categories: { select: { slug: true } },
    },
    orderBy: { published_at: 'asc' },
  });

  console.log(`Found ${posts.length} posts without featured images.\n`);

  // Track rotation index per category
  const rotationIndex: Record<string, number> = {};

  let updated = 0;

  for (const post of posts) {
    const catSlug = post.blog_categories.slug;
    const pool = imagePool[catSlug];

    if (!pool || pool.length === 0) {
      console.warn(`  ⚠️  No images for category "${catSlug}" (post: ${post.slug})`);
      continue;
    }

    // Rotate through the pool
    const idx = (rotationIndex[catSlug] || 0) % pool.length;
    rotationIndex[catSlug] = idx + 1;

    const imageUrl = pool[idx];

    await prisma.blog_posts.update({
      where: { id: post.id },
      data: {
        featured_image: imageUrl,
        featured_image_alt: post.title,
      },
    });

    updated++;
  }

  console.log(`\n✅ Updated ${updated} posts with featured images.`);
  console.log('🎉 Done!');
}

main()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

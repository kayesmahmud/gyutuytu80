import { prisma } from '../src/client';

/**
 * Replaces 47 broken Unsplash featured images with Lorem Picsum seed-based URLs.
 * picsum.photos/seed/{slug}/800/450 gives a consistent, deterministic image per post.
 */

const brokenSlugs = [
  'best-camera-phones-under-30000-nepal',
  'sell-used-clothes-online-nepal',
  'leather-jackets-nepal-2026',
  'womens-handbags-nepal',
  'buy-aquarium-fish-kathmandu-guide',
  'livestock-goat-farming-nepal-tips',
  'pet-grooming-services-kathmandu',
  'best-phone-cases-screen-protectors-nepal',
  'led-lights-fixtures-nepal-buyers-guide',
  'best-kids-toys-nepal-age-wise-guide',
  'trekking-gear-nepal-buy-rent-guide',
  'best-baby-products-nepal-diapers-cribs',
  'sell-car-fast-nepal-proven-tips',
  'best-projectors-home-nepal-under-30000',
  'property-tax-nepal-rates-how-to-pay',
  'chitwan-real-estate-land-house-prices',
  'property-registration-nepal-rajaswa-process',
  'mobile-insurance-nepal-worth-it-guide',
  'best-makeup-brands-nepal-2026',
  'adopt-stray-dog-nepal-legally',
  'find-best-tuition-teachers-kathmandu',
  'overseas-jobs-dubai-nepali-workers',
  'raw-materials-suppliers-nepal',
  'printing-packaging-machinery-nepal',
  'motorcycle-helmets-nepal-safety',
  'vehicle-pollution-test-nepal',
  'phone-repair-vs-replace-nepal-cost',
  'poultry-farming-nepal-setup-cost-returns',
  'business-license-nepal-guide',
  'router-wifi-setup-nepal-best-options',
  'best-pet-shops-kathmandu-2026',
  'buy-saree-online-nepal-2026',
  'bridal-lehenga-kathmandu-2026',
  '5g-phones-nepal-network-device-guide',
  'find-domestic-help-nepal-maid-cook',
  'used-car-prices-nepal-market-trends',
  'best-pet-food-brands-nepal-2026',
  'best-farming-tools-nepal-manual-machine',
  'healthcare-products-nepal-buy-online',
  'best-family-cars-nepal-2026',
  'best-mens-kurta-suruwal-nepal-2026',
  'gold-vs-artificial-jewelry-nepal',
  'wardrobe-storage-solutions-nepal',
  'electric-bike-prices-nepal-2026',
  'industrial-machinery-nepal-guide',
  'best-water-purifiers-nepal-ro-vs-uv',
  'pet-vaccination-schedule-nepal-complete',
];

async function main() {
  console.log(`Fixing ${brokenSlugs.length} broken featured images...\n`);
  let fixed = 0;

  for (const slug of brokenSlugs) {
    const post = await prisma.blog_posts.findUnique({ where: { slug } });
    if (!post) {
      console.log(`  ❌ Not found: ${slug}`);
      continue;
    }

    await prisma.blog_posts.update({
      where: { slug },
      data: {
        featured_image: `https://picsum.photos/seed/${slug}/800/450`,
      },
    });
    fixed++;
  }

  console.log(`\n✅ Fixed ${fixed} posts with picsum.photos images`);

  // Verify no more broken unsplash images
  const allWithImages = await prisma.blog_posts.findMany({
    where: { featured_image: { not: null } },
    select: { slug: true, featured_image: true },
  });

  let stillBroken = 0;
  for (const p of allWithImages) {
    if (p.featured_image?.includes('unsplash')) {
      try {
        const resp = await fetch(p.featured_image, { method: 'HEAD', redirect: 'follow' });
        if (!resp.ok) stillBroken++;
      } catch {
        stillBroken++;
      }
    }
  }
  console.log(`📊 Still broken after fix: ${stillBroken}`);
}

main()
  .catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());

import { prisma } from '../src/client';

/**
 * Adds an internal "You May Also Like" section near the end of each blog post's
 * HTML content, linking to 2-3 related posts from the same or related categories.
 * Only targets the 100 new posts (batch 2). Skips posts that already have internal links.
 */

// Category affinity map — which categories link well to each other
const relatedCategories: Record<string, string[]> = {
  'fashion-lifestyle': ['pets-animals', 'home-living', 'essentials'],
  'pets-animals': ['fashion-lifestyle', 'essentials', 'home-living'],
  'services': ['jobs-careers', 'home-living', 'business-industry'],
  'jobs-careers': ['services', 'business-industry'],
  'home-living': ['essentials', 'fashion-lifestyle', 'business-industry'],
  'hobbies-sports': ['essentials', 'home-living', 'fashion-lifestyle'],
  'business-industry': ['services', 'agriculture', 'jobs-careers'],
  'agriculture': ['business-industry', 'essentials'],
  'essentials': ['home-living', 'pets-animals', 'fashion-lifestyle'],
  'vehicles': ['electronics', 'property'],
  'electronics': ['vehicles', 'mobiles'],
  'property': ['home-living', 'vehicles'],
  'mobiles': ['electronics'],
};

async function main() {
  console.log('Adding internal links to blog posts...\n');

  // Get all published posts
  const allPosts = await prisma.blog_posts.findMany({
    where: { status: 'published' },
    select: {
      id: true,
      slug: true,
      title: true,
      title_ne: true,
      content: true,
      content_ne: true,
      blog_categories: { select: { slug: true } },
    },
  });

  // Build lookup maps
  const postsByCategory = new Map<string, typeof allPosts>();
  for (const post of allPosts) {
    const catSlug = post.blog_categories.slug;
    if (!postsByCategory.has(catSlug)) postsByCategory.set(catSlug, []);
    postsByCategory.get(catSlug)!.push(post);
  }

  // New categories from batch 2 + existing categories that got new posts
  const targetCategories = [
    'fashion-lifestyle', 'pets-animals', 'services', 'jobs-careers',
    'home-living', 'hobbies-sports', 'business-industry', 'agriculture',
    'essentials', 'vehicles', 'electronics', 'property', 'mobiles',
  ];

  let updated = 0;
  let skipped = 0;

  for (const post of allPosts) {
    const catSlug = post.blog_categories.slug;

    // Only process posts in target categories
    if (!targetCategories.includes(catSlug)) {
      continue;
    }

    // Skip if already has internal links section
    if (post.content?.includes('you-may-also-like') || post.content?.includes('सम्बन्धित लेखहरू')) {
      skipped++;
      continue;
    }

    // Get 2-3 related posts: 2 from same category, 1 from related category
    const sameCategoryPosts = (postsByCategory.get(catSlug) || [])
      .filter(p => p.id !== post.id)
      .slice(0, 2);

    const relatedCatSlugs = relatedCategories[catSlug] || [];
    let crossCategoryPost: typeof allPosts[0] | null = null;
    for (const relCat of relatedCatSlugs) {
      const candidates = postsByCategory.get(relCat) || [];
      if (candidates.length > 0) {
        // Pick a random one to vary links across posts
        crossCategoryPost = candidates[Math.floor(Math.random() * candidates.length)];
        break;
      }
    }

    const linkedPosts = [...sameCategoryPosts];
    if (crossCategoryPost) linkedPosts.push(crossCategoryPost);

    if (linkedPosts.length === 0) continue;

    // Build EN links section
    const enLinks = linkedPosts
      .map(p => `<li><a href="/en/blog/${p.slug}">${p.title}</a></li>`)
      .join('\n    ');
    const enSection = `

<div id="you-may-also-like" class="related-reads">
<h2 id="you-may-also-like">You May Also Like</h2>
<ul>
    ${enLinks}
</ul>
</div>`;

    // Build NE links section
    const neLinks = linkedPosts
      .map(p => `<li><a href="/ne/blog/${p.slug}">${p.title_ne || p.title}</a></li>`)
      .join('\n    ');
    const neSection = `

<div id="सम्बन्धित-लेखहरू" class="related-reads">
<h2 id="सम्बन्धित-लेखहरू">सम्बन्धित लेखहरू</h2>
<ul>
    ${neLinks}
</ul>
</div>`;

    // Insert before the closing content (append to end)
    const newContent = (post.content || '') + enSection;
    const newContentNe = (post.content_ne || '') + neSection;

    await prisma.blog_posts.update({
      where: { id: post.id },
      data: {
        content: newContent,
        content_ne: newContentNe,
      },
    });

    updated++;
    if (updated % 20 === 0) console.log(`  ... ${updated} posts updated`);
  }

  console.log(`\n✅ Added internal links to ${updated} posts (${skipped} already had them)`);
}

main()
  .catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());

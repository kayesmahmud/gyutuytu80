import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { prisma } from '../src/client';

/**
 * Seed the category_keywords table from data/category-keywords.json —
 * the keyword→category dictionary that powers post-ad title suggestions.
 *
 * Idempotent: upserts by keyword, so it's safe to re-run after editing
 * the JSON (new keywords added, retargeted keywords updated).
 *
 *   cd packages/database && npx tsx scripts/seed-category-keywords.ts
 */

interface KeywordEntry {
  keyword: string;
  category_slug: string;
  subcategory_slug: string | null;
}

const dataPath = fileURLToPath(new URL('../data/category-keywords.json', import.meta.url));
const entries = JSON.parse(readFileSync(dataPath, 'utf-8')) as KeywordEntry[];

async function main() {
  const categories = await prisma.categories.findMany({
    select: { id: true, slug: true, parent_id: true },
  });
  const idBySlug = new Map(categories.map((c) => [c.slug, c]));

  let upserted = 0;
  let skipped = 0;
  for (const entry of entries) {
    const category = idBySlug.get(entry.category_slug);
    const subcategory = entry.subcategory_slug ? idBySlug.get(entry.subcategory_slug) : null;
    if (!category || (entry.subcategory_slug && !subcategory)) {
      console.warn(`⚠️ Unknown slug, skipping: ${JSON.stringify(entry)}`);
      skipped++;
      continue;
    }
    if (subcategory && subcategory.parent_id !== category.id) {
      console.warn(`⚠️ ${entry.subcategory_slug} is not a child of ${entry.category_slug}, skipping`);
      skipped++;
      continue;
    }
    await prisma.category_keywords.upsert({
      where: { keyword: entry.keyword },
      create: {
        keyword: entry.keyword,
        category_id: category.id,
        subcategory_id: subcategory?.id ?? null,
      },
      update: {
        category_id: category.id,
        subcategory_id: subcategory?.id ?? null,
      },
    });
    upserted++;
  }
  console.log(`✅ Seeded category keywords: ${upserted} upserted, ${skipped} skipped`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

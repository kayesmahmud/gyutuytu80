import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { prisma } from '../src/client';

/**
 * Seed the shared (GLOBAL) editor response-template library from
 * response-templates.catalog.json — 36 bilingual (English + Nepali) templates
 * across ad_rejection / verification_rejection / support / suspension.
 *
 * Idempotent: skips any global template that already exists with the same
 * (title, category), so it's safe to re-run after edits.
 *
 *   cd packages/database && npx tsx scripts/seed-response-templates.ts
 */

interface CatalogTemplate {
  title_en: string;
  title_ne: string;
  content_en: string;
  content_ne: string;
}
interface CatalogCategory {
  category: string;
  templates: CatalogTemplate[];
}

const catalogPath = fileURLToPath(new URL('./response-templates.catalog.json', import.meta.url));
const catalog = JSON.parse(readFileSync(catalogPath, 'utf-8')) as { categories: CatalogCategory[] };

async function main() {
  // Own the seeded global templates with a staff account (super_admin/root preferred).
  const owner =
    (await prisma.users.findFirst({
      where: { role: { in: ['super_admin', 'root'] } },
      orderBy: { id: 'asc' },
      select: { id: true, full_name: true, role: true },
    })) ||
    (await prisma.users.findFirst({
      where: { role: 'editor' },
      orderBy: { id: 'asc' },
      select: { id: true, full_name: true, role: true },
    }));

  if (!owner) {
    throw new Error('No staff user (super_admin/root/editor) found to own the seeded templates.');
  }
  console.log(`Seeding global templates owned by #${owner.id} ${owner.full_name} (${owner.role})`);

  let created = 0;
  let skipped = 0;

  for (const group of catalog.categories) {
    for (const t of group.templates) {
      const exists = await prisma.support_macros.findFirst({
        where: { title: t.title_en, category: group.category, visibility: 'global' },
        select: { id: true },
      });
      if (exists) {
        skipped++;
        continue;
      }
      await prisma.support_macros.create({
        data: {
          title: t.title_en,
          title_ne: t.title_ne,
          content: t.content_en,
          content_ne: t.content_ne,
          category: group.category,
          visibility: 'global',
          created_by: owner.id,
        },
      });
      created++;
    }
  }

  console.log(`✅ Done. Created ${created}, skipped ${skipped} (already present).`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

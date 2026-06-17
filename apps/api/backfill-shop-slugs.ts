/**
 * One-off backfill: give a shop_slug to every user who is missing one.
 *
 * These are users created before the mobile Google/Apple OAuth paths were fixed
 * to auto-generate a slug (see apps/api/src/utils/shopSlug.ts). Without a slug
 * the editor "View Shop" button does nothing.
 *
 * Reuses generateShopSlug() so the backfill matches exactly what new signups get
 * (including whatever empty-name fallback you chose).
 *
 * Usage (from apps/api/):
 *   npx tsx backfill-shop-slugs.ts            # dry run — prints the plan only
 *   npx tsx backfill-shop-slugs.ts --apply    # actually writes
 */
import { prisma } from '@thulobazaar/database';
import { generateShopSlug } from './src/utils/shopSlug.js';

const APPLY = process.argv.includes('--apply');

async function main() {
  const users = await prisma.users.findMany({
    where: { OR: [{ shop_slug: null }, { shop_slug: '' }] },
    select: { id: true, full_name: true, email: true, oauth_provider: true },
    orderBy: { id: 'asc' },
  });

  console.log(`Found ${users.length} user(s) with no shop_slug.${APPLY ? '' : '  (dry run)'}\n`);

  let updated = 0;
  let failed = 0;

  for (const u of users) {
    const slug = generateShopSlug(u.full_name ?? '', u.id);
    const tag = `#${u.id} ${u.email ?? u.full_name ?? '(no name)'} [${u.oauth_provider ?? 'phone'}]`;

    if (!APPLY) {
      console.log(`  would set ${tag} -> ${slug}`);
      continue;
    }

    try {
      await prisma.users.update({ where: { id: u.id }, data: { shop_slug: slug } });
      console.log(`  ✅ ${tag} -> ${slug}`);
      updated++;
    } catch (err) {
      // shop_slug is @unique — only fails on the astronomically unlikely
      // collision with an existing custom_shop_slug. Log and move on.
      console.error(`  ❌ ${tag} -> ${slug}  (${(err as Error).message})`);
      failed++;
    }
  }

  if (APPLY) console.log(`\nDone. Updated ${updated}, failed ${failed}.`);
  else console.log(`\nDry run complete. Re-run with --apply to write.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

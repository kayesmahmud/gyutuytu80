#!/usr/bin/env node
/**
 * Single source of truth sync for the 16 home-page category icons.
 *
 * Copies a processed icon set (PNG-per-slug) from the master folder into BOTH
 * deployment targets so the desktop web, mobile web, iOS, and Android all render
 * the exact same image bytes.
 *
 *   master:  "Categories Icons/<set>_processed/<slug>.png"
 *   web:     apps/web/public/category-icons/<slug>.png
 *   mobile:  apps/mobile/assets/category-icons/<slug>.png
 *
 * Usage:
 *   node scripts/sync-category-icons.mjs           # default set: flat
 *   node scripts/sync-category-icons.mjs glossy    # switch the active set
 */
import { existsSync, mkdirSync, readdirSync, copyFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// Accepts SEVERAL sets, because the parent icons and the subcategory icons live in separate
// master folders. Passing only one wipes the target dir and ships half the icons -- syncing
// just "subcategories" would silently delete all 16 parent icons.
const setNames = process.argv.slice(2).length ? process.argv.slice(2) : ['realistic', 'subcategories'];
const TARGETS = [
  join(ROOT, 'apps', 'web', 'public', 'category-icons'),
  join(ROOT, 'apps', 'mobile', 'assets', 'category-icons'),
];

const sources = new Map(); // filename -> absolute path
for (const setName of setNames) {
  const src = join(ROOT, 'Categories Icons', `${setName}_processed`);
  if (!existsSync(src)) {
    console.error(`✗ Source folder not found: ${src}`);
    console.error(`  Generate + process it first (generate.py, then cutout_u2net.py --set ${setName}).`);
    process.exit(1);
  }
  const files = readdirSync(src).filter((f) => f.endsWith('.png') && !f.includes('_preview'));
  if (files.length === 0) {
    console.error(`✗ No PNG icons in ${src}`);
    process.exit(1);
  }
  for (const f of files) {
    if (sources.has(f)) {
      console.error(`✗ "${f}" appears in more than one set — slugs must be unique across sets.`);
      process.exit(1);
    }
    sources.set(f, join(src, f));
  }
}

for (const dir of TARGETS) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const [name, from] of sources) copyFileSync(from, join(dir, name));
  console.log(`✓ ${sources.size} icons -> ${dir.replace(ROOT + '/', '')}`);
}

console.log(`Done. Active category-icon sets: ${setNames.join(' + ')}`);

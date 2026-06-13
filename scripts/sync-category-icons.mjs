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
const setName = process.argv[2] || 'flat';
const SRC = join(ROOT, 'Categories Icons', `${setName}_processed`);
const TARGETS = [
  join(ROOT, 'apps', 'web', 'public', 'category-icons'),
  join(ROOT, 'apps', 'mobile', 'assets', 'category-icons'),
];

if (!existsSync(SRC)) {
  console.error(`✗ Source folder not found: ${SRC}`);
  console.error(`  Generate + process it first (generate.py, then process_icons.py --set ${setName}).`);
  process.exit(1);
}

const files = readdirSync(SRC).filter((f) => f.endsWith('.png') && !f.includes('_preview'));
if (files.length === 0) {
  console.error(`✗ No PNG icons in ${SRC}`);
  process.exit(1);
}

for (const dir of TARGETS) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const f of files) copyFileSync(join(SRC, f), join(dir, f));
  console.log(`✓ ${files.length} icons -> ${dir.replace(ROOT + '/', '')}`);
}

console.log(`Done. Active category-icon set: "${setName}"`);

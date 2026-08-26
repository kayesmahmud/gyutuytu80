/**
 * Seed local ad images from ~/Documents/Web/thulobazaar/Images.
 *
 * Mirrors the real upload pipeline instead of plain-copying files:
 *   - re-encodes to AVIF with the exact `ad` preset from
 *     apps/api/src/middleware/optimizeImage.ts (1920px, q65, effort 2)
 *   - names files `ad-<ts>-<rand>.avif` like apps/api/src/middleware/upload.ts
 *   - writes file_path with the leading slash that createAdImages() uses today
 *
 * Emits SQL on stdout; it does not touch the DB itself.
 * LOCAL DEV ONLY.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC = '/Users/elw/Documents/Web/thulobazaar/Images';
const DEST = '/Users/elw/Documents/Web/thulobazaar/monorepo/apps/api/uploads/ads';
const MAX_IMAGES_PER_AD = 4;
const AD_PRESET = { maxWidth: 1920, maxHeight: 1920, quality: 65, effort: 2 };

// ---------------------------------------------------------------------------
// ad id -> source folder. Exact content match where one exists, otherwise the
// nearest available category (no motorbike/furniture/pet/tablet source images).
// `null` = deliberately left image-less; nothing here is even close.
// ---------------------------------------------------------------------------
const MAPPING = {
  1:  'Apple - iPhone 17 256GB - Sage',                       // iPhone 13 Pro Max
  2:  '2013 Kia Optima EX car',                               // Honda CB150R -> nearest: vehicle
  3:  'Bungalow on sale',                                     // 2 BHK Apartment Rent
  4:  'Apple - MacBook Air 13-inch Laptop - Apple M4 chip Built for Apple Intelligence - 16GB Memory - 512GB SSD ',
  5:  'Samsung - Galaxy S25+ 256GB',                          // "Samsung" (phone)
  7:  'Apple - iPhone 17 256GB - Sage',
  15: 'Apple - iPhone 17 256GB - Sage',
  16: 'Apple - iPhone 17 256GB - Sage',
  17: 'Apple - iPhone 17 256GB - Sage',
  18: 'Apple - iPhone 17 256GB - Sage',
  19: 'Apple - iPhone 17 256GB - Sage',
  23: 'Apple - iPhone 17 256GB - Sage',
  21: 'Bungalow on sale',                                     // Wood Bed -> nearest: interior
  22: '2015 Audi Q5 3.0T quattro Premium Plus Car',           // Toyota car
  24: '2021 Mercedes-Benz S-Class S 580',                     // Toyota Prius
  25: 'Bungalow on sale',                                     // Wooden Dining Table -> interior
  26: 'High Waist Denim Shorts',                              // Jeans Pants
  30: 'Chevrolet 2025 car',                                   // Ferrari 480
  31: '2023 Land Rover Defender ',                            // Range Rover 2010
  32: 'Apple - MacBook Air 13-inch Laptop - Apple M4 chip Built for Apple Intelligence - 16GB Memory - 512GB SSD ',
  34: 'Cashmere Tank + Bag Women',                            // Ladies bag
  35: 'Bungalow on sale',                                     // House for sale
  38: 'Dell - Premium - 16" 4K Touchscreen Laptop - Intel Core Ultra 9 285H - 32GB Memory - NVIDIA GeForce RTX 5060 - 1TB Storage',
  39: 'Samsung - Galaxy Book5 360 - Copilot+ PC - 15.6" FHD AMOLED Touch-Screen Laptop - Intel Core Ultra 7 - 16GB Memory - 512GB SSD',

  // Placeholder-title ads: no content signal, so they get distinct leftover
  // folders purely so the local feed looks populated when browsing.
  8:  'Google - Pixel 10 Pro 128GB',
  9:  'Motorola - moto g play 2024 64GB',
  10: 'Acer - Refurbished Excellent - Swift Edge - 16" Laptop AMD Ryzen 7 7735U 2.7GHz 16GB RAM 1TB SSD',
  11: 'Lenovo - IdeaPad Slim 3 15.6" Full HD Touchscreen Laptop - AMD Ryzen 7 5825U 2025 - 16GB Memory - 512GB SSD ',
  12: 'Samsung - Galaxy Chromebook Go - 14" LED Laptop - Intel Celeron',
  13: 'Double-Breasted Trench Coat',
  14: 'Ramie Shirt with Pockets',
  33: 'V-Neck Pure Cotton T-shirt',
  36: 'Washed Denim Men Shirt',

  28: null,  // Pet rabbit  — no animal images
  29: null,  // Painter     — no service images
  37: null,  // my Cat      — no animal images
};

// Untouched by explicit instruction: #44/#45 are consumed by Playwright specs,
// #56–#60 already render fine.
const SKIP = new Set([44, 45, 56, 57, 58, 59, 60]);

const sqlStr = (s) => `'${String(s).replace(/'/g, "''")}'`;
// "Main Image" first so it becomes is_primary; the rest in natural order.
const rank = (n) => (/main/i.test(n) ? 0 : /2nd/i.test(n) ? 1 : /3rd/i.test(n) ? 2 : /4th/i.test(n) ? 3 : 4);

let counter = 0;
const out = [];
const targets = Object.entries(MAPPING)
  .map(([id, folder]) => [Number(id), folder])
  .filter(([id]) => !SKIP.has(id))
  .sort((a, b) => a[0] - b[0]);

out.push('BEGIN;');
out.push('-- Clear rows for the ads being seeded. This also removes the stale rows');
out.push('-- whose files had been deleted from disk (the "broken image" ads).');
out.push(`DELETE FROM ad_images WHERE ad_id IN (${targets.map(([id]) => id).join(',')});`);

// Sequential on purpose: keeps SQL statement order deterministic so the script
// is diffable and re-runnable, and avoids 100+ concurrent AVIF encodes.
for (const [adId, folder] of targets) {
  if (!folder) { console.error(`ad ${adId}: intentionally left image-less`); continue; }
  const dir = path.join(SRC, folder);
  if (!fs.existsSync(dir)) { console.error(`ad ${adId}: MISSING FOLDER -> ${folder}`); process.exitCode = 1; continue; }

  const files = fs.readdirSync(dir)
    .filter((f) => /\.(jpe?g|webp|png)$/i.test(f))
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
    .slice(0, MAX_IMAGES_PER_AD);

  if (!files.length) { console.error(`ad ${adId}: no usable images in ${folder}`); process.exitCode = 1; continue; }

  let index = 0;
  for (const srcName of files) {
    // Deterministic, collision-free, still shaped like a real multer upload.
    const filename = `ad-${1766600000000 + counter * 1000}-${100000000 + counter}.avif`;
    counter++;
    const avif = await sharp(fs.readFileSync(path.join(dir, srcName)))
      .resize(AD_PRESET.maxWidth, AD_PRESET.maxHeight, { fit: 'inside', withoutEnlargement: true })
      .avif({ quality: AD_PRESET.quality, effort: AD_PRESET.effort, chromaSubsampling: '4:2:0' })
      .toBuffer();
    fs.writeFileSync(path.join(DEST, filename), avif);
    out.push(
      'INSERT INTO ad_images (ad_id, filename, original_name, file_path, file_size, mime_type, is_primary) ' +
      `VALUES (${adId}, ${sqlStr(filename)}, ${sqlStr(srcName)}, ${sqlStr('/uploads/ads/' + filename)}, ` +
      `${avif.length}, 'image/avif', ${index === 0});`
    );
    index++;
  }
  console.error(`ad ${adId}: ${files.length} image(s) <- ${folder}`);
}

out.push('COMMIT;');
process.stdout.write(out.join('\n') + '\n');
console.error(`\nDONE: ${counter} images encoded for ${targets.filter(([, f]) => f).length} ads`);

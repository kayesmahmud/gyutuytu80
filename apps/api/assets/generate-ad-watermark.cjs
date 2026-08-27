/**
 * Regenerates assets/ad-watermark.png (also copied to apps/web/public/) —
 * the pre-baked ad-photo watermark: white Thulo Bazaar logo at 20% opacity
 * over a soft black shadow at 10%, on a transparent canvas.
 *
 * Runtime code (api: src/lib/watermark.ts, web: src/lib/utils/watermark.ts)
 * only ever scales this master DOWN and stamps it bottom-right, so tune the
 * look here and re-run:
 *
 *   node apps/api/assets/generate-ad-watermark.cjs
 *   cp apps/api/assets/ad-watermark.png apps/web/public/ad-watermark.png
 */
const path = require('path');
const sharp = require('sharp');

const REPO_ROOT = path.resolve(__dirname, '../../..');
const LOGO = path.join(REPO_ROOT, 'apps/web/public/logo White.png');
const OUT = path.join(__dirname, 'ad-watermark.png');

const MASTER_WIDTH = 800;   // master is large; runtime scales DOWN only
const LOGO_OPACITY = 0.30;  // subtle — the seller's photo stays dominant
const SHADOW_OPACITY = 0.10;
const SHADOW_BLUR = 8;      // sigma at 800px width
const SHADOW_OFFSET = 4;    // px down-right at 800px width
const MARGIN = 28;          // room for the blur to breathe

// Multiply an RGBA buffer's alpha channel by `factor` (dest-in with a tiled 1x1 pixel)
async function fadeAlpha(buffer, factor) {
  const mask = Buffer.from([0, 0, 0, Math.round(255 * factor)]);
  return sharp(buffer)
    .composite([{ input: mask, raw: { width: 1, height: 1, channels: 4 }, tile: true, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

// Flat single-color silhouette: a solid rect masked by the logo's alpha
async function silhouetteOf(logo, w, h, color) {
  return sharp({ create: { width: w, height: h, channels: 4, background: color } })
    .composite([{ input: logo, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

(async () => {
  // 1. Trim transparent padding, scale to master width
  const source = await sharp(LOGO).trim().resize({ width: MASTER_WIDTH }).png().toBuffer();
  const { width: w, height: h } = await sharp(source).metadata();

  // 2. Flatten the logo to PURE white (the source's red cart circle included —
  //    owner wants a fully monochrome watermark)
  const logo = await silhouetteOf(source, w, h, { r: 255, g: 255, b: 255, alpha: 1 });

  // 3. Black silhouette for the shadow
  const silhouette = await silhouetteOf(source, w, h, { r: 0, g: 0, b: 0, alpha: 1 });

  const pad = (img, top, left) =>
    sharp(img).extend({
      top, left,
      bottom: 2 * MARGIN - top,
      right: 2 * MARGIN - left,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    }).png().toBuffer();

  // 4. Shadow: silhouette shifted down-right on a padded canvas, blurred, faded
  let shadow = await pad(silhouette, MARGIN + SHADOW_OFFSET, MARGIN + SHADOW_OFFSET);
  shadow = await sharp(shadow).blur(SHADOW_BLUR).png().toBuffer();
  shadow = await fadeAlpha(shadow, SHADOW_OPACITY);

  // 5. Logo layer: centered on the same canvas, faded
  let logoLayer = await pad(logo, MARGIN, MARGIN);
  logoLayer = await fadeAlpha(logoLayer, LOGO_OPACITY);

  // 6. Stack shadow + logo on a transparent canvas
  const cw = w + 2 * MARGIN;
  const ch = h + 2 * MARGIN;
  await sharp({ create: { width: cw, height: ch, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: shadow }, { input: logoLayer }])
    .png({ compressionLevel: 9 })
    .toFile(OUT);

  console.log(`✅ ${OUT} — ${cw}x${ch}`);
})();

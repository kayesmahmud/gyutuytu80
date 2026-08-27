/**
 * Ad-photo watermark: the Thulo Bazaar logo stamped bottom-right of every
 * uploaded ad image. Opacity is pre-baked into public/ad-watermark.png
 * (regenerate with apps/api/assets/generate-ad-watermark.cjs), so runtime
 * work is just scale-down + composite.
 *
 * Fail-open everywhere: a missing asset or an odd image shape means "no
 * watermark", never a failed upload.
 *
 * Twin implementation for the Express upload path: apps/api/src/lib/watermark.ts
 */
import sharp from 'sharp';
import path from 'path';
import { promises as fs } from 'fs';

// Same base the upload writer uses — resolves in dev and in the standalone
// prod image (server.js chdirs to apps/web, and public/ ships in the image)
const ASSET_PATH = path.join(process.cwd(), 'public', 'ad-watermark.png');

const WATERMARK_WIDTH_RATIO = 0.16; // logo width relative to the photo
const MARGIN_RATIO = 0.02; // gap from the bottom-right corner
const MIN_WATERMARK_WIDTH = 48; // below this the logo is unreadable — skip

let masterPromise: Promise<Buffer | null> | null = null;

function loadMaster(): Promise<Buffer | null> {
  if (!masterPromise) {
    masterPromise = fs.readFile(ASSET_PATH).catch((err) => {
      console.error('⚠️ Ad watermark asset unreadable — skipping watermarks:', err?.message);
      return null;
    });
  }
  return masterPromise;
}

/**
 * Build the sharp composite overlay for an ad photo with the given FINAL
 * (post-resize) dimensions. Returns [] whenever watermarking should be skipped.
 */
export async function adWatermarkOverlay(
  imageWidth: number,
  imageHeight: number
): Promise<sharp.OverlayOptions[]> {
  try {
    const master = await loadMaster();
    if (!master) return [];

    const wmWidth = Math.round(imageWidth * WATERMARK_WIDTH_RATIO);
    if (wmWidth < MIN_WATERMARK_WIDTH) return [];

    const margin = Math.round(imageWidth * MARGIN_RATIO);
    // Transparent margin baked into the overlay: gravity 'southeast' then
    // lands it with padding, with no left/top math that could overflow.
    const overlay = await sharp(master)
      .resize({ width: wmWidth })
      .extend({ bottom: margin, right: margin, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    const { height: overlayHeight } = await sharp(overlay).metadata();
    if (!overlayHeight || overlayHeight >= imageHeight) return []; // extreme banner shapes

    return [{ input: overlay, gravity: 'southeast' }];
  } catch (err) {
    console.error('⚠️ Ad watermark generation failed — skipping:', err);
    return [];
  }
}

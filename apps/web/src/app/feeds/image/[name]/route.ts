/**
 * JPEG renditions of ad images, for the product feeds.
 *
 * Ad images are stored as AVIF (442 of 465 at time of writing). Meta's catalog
 * ingester accepts JPEG and PNG only, so pointing the feeds at the raw upload
 * URLs would get roughly 95% of the catalog rejected — with no useful error,
 * since the feed itself validates fine.
 *
 * Converting here rather than re-encoding storage means existing ads and every
 * future upload both work, with no change to the upload pipeline and no
 * backfill. Only the feeds use this route; the site keeps serving AVIF, which
 * is smaller and what browsers actually want.
 *
 * The web container has no access to the uploads volume (it is mounted on the
 * api service only), so the source is fetched over HTTP through the same
 * /uploads rewrite the browser uses.
 */

import sharp from 'sharp';

// sharp is a native module — it cannot run on the edge runtime.
export const runtime = 'nodejs';

const UPLOAD_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL || 'https://api.thulobazaar.com.np';

/** Meta wants >=500px; 1200 matches its recommended catalog size. */
const MAX_EDGE = 1200;
const JPEG_QUALITY = 82;

/**
 * Filenames come from our own feed, but this route is publicly reachable, so
 * treat the segment as untrusted: allow only the shapes our uploader produces
 * and never anything that could climb out of uploads/ads.
 */
const SAFE_NAME = /^[A-Za-z0-9._-]+$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;

  if (!SAFE_NAME.test(name) || name.includes('..')) {
    return new Response('Invalid image name', { status: 400 });
  }

  try {
    const source = await fetch(`${UPLOAD_ORIGIN}/uploads/ads/${name}`);
    if (!source.ok) {
      return new Response('Source image not found', { status: 404 });
    }

    const jpeg = await sharp(Buffer.from(await source.arrayBuffer()))
      // JPEG has no alpha channel; without a flatten, transparent areas
      // render black instead of white.
      .flatten({ background: '#ffffff' })
      .resize(MAX_EDGE, MAX_EDGE, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY, progressive: true })
      .toBuffer();

    return new Response(new Uint8Array(jpeg), {
      headers: {
        'Content-Type': 'image/jpeg',
        // Upload filenames embed a timestamp and are never rewritten, so the
        // rendition for a given name is immutable.
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Feed image conversion failed:', name, error);
    return new Response('Image conversion failed', { status: 502 });
  }
}

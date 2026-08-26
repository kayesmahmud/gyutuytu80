import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import sharp from 'sharp';
import { imagesToDataUrls } from '../../lib/ai/images.js';

describe('imagesToDataUrls', () => {
  it('re-encodes stored images as bounded JPEG data URLs and skips unreadable files', async () => {
    const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'ai-img-'));
    const pngPath = path.join(dir, 'listing.png');
    await sharp({
      create: { width: 1600, height: 900, channels: 3, background: { r: 200, g: 30, b: 30 } },
    })
      .png()
      .toFile(pngPath);

    const urls = await imagesToDataUrls([pngPath, path.join(dir, 'missing.avif')]);

    expect(urls).toHaveLength(1);
    expect(urls[0].startsWith('data:image/jpeg;base64,')).toBe(true);

    const decoded = Buffer.from(urls[0].slice('data:image/jpeg;base64,'.length), 'base64');
    const meta = await sharp(decoded).metadata();
    expect(meta.format).toBe('jpeg');
    expect(Math.max(meta.width ?? 0, meta.height ?? 0)).toBeLessThanOrEqual(768);

    await fs.promises.rm(dir, { recursive: true, force: true });
  });
});

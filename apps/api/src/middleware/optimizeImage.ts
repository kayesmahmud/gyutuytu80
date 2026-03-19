import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

type OutputFormat = 'jpeg' | 'avif';

interface OptimizeOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  effort?: number;
  format: OutputFormat;
}

const PRESETS: Record<string, OptimizeOptions> = {
  avatar: { maxWidth: 500, maxHeight: 500, quality: 85, format: 'jpeg' },
  cover: { maxWidth: 1920, maxHeight: 1080, quality: 85, format: 'jpeg' },
  ad: { maxWidth: 1920, maxHeight: 1920, quality: 65, effort: 4, format: 'avif' },
  message: { maxWidth: 1200, maxHeight: 1200, quality: 45, effort: 4, format: 'avif' },
  document: { maxWidth: 1920, maxHeight: 1920, quality: 70, effort: 4, format: 'avif' },
};

/**
 * Optimize a single image file in-place using sharp.
 * Resizes and compresses to JPEG.
 */
async function optimizeFile(filePath: string, opts: OptimizeOptions): Promise<void> {
  const buffer = fs.readFileSync(filePath);

  let instance = sharp(buffer);
  const metadata = await instance.metadata();

  // Skip non-image formats (like PDFs)
  if (!metadata.format || !['jpeg', 'png', 'webp', 'gif', 'tiff', 'heif'].includes(metadata.format)) {
    return;
  }

  // Only resize if image is larger than max dimensions
  const needsResize =
    (metadata.width && metadata.width > opts.maxWidth) ||
    (metadata.height && metadata.height > opts.maxHeight);

  if (needsResize) {
    instance = instance.resize(opts.maxWidth, opts.maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Compress with the preset's format
  const optimized = opts.format === 'avif'
    ? await instance.avif({ quality: opts.quality, effort: opts.effort, chromaSubsampling: '4:2:0' }).toBuffer()
    : await instance.jpeg({ quality: opts.quality }).toBuffer();

  // Overwrite the original file with optimized version
  const ext = opts.format === 'avif' ? '.avif' : '.jpg';
  const parsed = path.parse(filePath);
  const newPath = path.join(parsed.dir, `${parsed.name}${ext}`);
  fs.writeFileSync(newPath, optimized);

  // Remove original if extension changed
  if (newPath !== filePath) {
    fs.unlinkSync(filePath);
  }
}

/**
 * Express middleware that optimizes uploaded images after multer saves them.
 * Usage: router.post('/upload', multerUpload.single('image'), optimizeImage('avatar'), handler)
 */
export function optimizeImage(preset: keyof typeof PRESETS = 'ad') {
  const opts = PRESETS[preset];

  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const ext = opts.format === 'avif' ? '.avif' : '.jpg';
      const mime = opts.format === 'avif' ? 'image/avif' : 'image/jpeg';

      // Handle single file upload
      if (req.file) {
        await optimizeFile(req.file.path, opts);
        const parsed = path.parse(req.file.filename);
        req.file.filename = `${parsed.name}${ext}`;
        req.file.path = path.join(path.dirname(req.file.path), req.file.filename);
        req.file.mimetype = mime;
      }

      // Handle multiple file uploads
      if (req.files) {
        const files = Array.isArray(req.files)
          ? req.files
          : Object.values(req.files).flat();

        for (const file of files) {
          await optimizeFile(file.path, opts);
          const parsed = path.parse(file.filename);
          file.filename = `${parsed.name}${ext}`;
          file.path = path.join(path.dirname(file.path), file.filename);
          file.mimetype = mime;
        }
      }

      next();
    } catch (error) {
      console.error('Image optimization error:', error);
      // Don't block upload if optimization fails — continue with original
      next();
    }
  };
}

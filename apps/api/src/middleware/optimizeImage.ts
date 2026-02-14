import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

interface OptimizeOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
}

const PRESETS: Record<string, OptimizeOptions> = {
  avatar: { maxWidth: 500, maxHeight: 500, quality: 80 },
  cover: { maxWidth: 1920, maxHeight: 1080, quality: 85 },
  ad: { maxWidth: 1920, maxHeight: 1920, quality: 85 },
  message: { maxWidth: 1200, maxHeight: 1200, quality: 80 },
  document: { maxWidth: 1920, maxHeight: 1920, quality: 90 },
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
  if (!metadata.format || !['jpeg', 'png', 'webp', 'gif', 'tiff'].includes(metadata.format)) {
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

  // Compress as JPEG
  const optimized = await instance.jpeg({ quality: opts.quality }).toBuffer();

  // Overwrite the original file with optimized version
  const parsed = path.parse(filePath);
  const newPath = path.join(parsed.dir, `${parsed.name}.jpg`);
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
      // Handle single file upload
      if (req.file) {
        await optimizeFile(req.file.path, opts);
        // Update filename to .jpg if it changed
        const parsed = path.parse(req.file.filename);
        req.file.filename = `${parsed.name}.jpg`;
        req.file.path = path.join(path.dirname(req.file.path), req.file.filename);
        req.file.mimetype = 'image/jpeg';
      }

      // Handle multiple file uploads
      if (req.files) {
        const files = Array.isArray(req.files)
          ? req.files
          : Object.values(req.files).flat();

        for (const file of files) {
          await optimizeFile(file.path, opts);
          const parsed = path.parse(file.filename);
          file.filename = `${parsed.name}.jpg`;
          file.path = path.join(path.dirname(file.path), file.filename);
          file.mimetype = 'image/jpeg';
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

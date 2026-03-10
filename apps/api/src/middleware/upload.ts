import multer from 'multer';
import path from 'path';
import fs from 'fs';
import config from '../config/index.js';

// Derive extension from MIME type — never trust client-provided filename extension
const IMAGE_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/heic': '.heic',
  'image/heif': '.heif',
};
const DOC_MIME_TO_EXT: Record<string, string> = {
  ...IMAGE_MIME_TO_EXT,
  'application/pdf': '.pdf',
};
const safeExt = (mimetype: string, map: Record<string, string>): string =>
  map[mimetype.toLowerCase()] ?? '.bin';

// Maximum file size for all uploads: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Ensure upload directories exist
const uploadsDir = path.resolve(config.UPLOAD_DIR);
const avatarsDir = path.join(uploadsDir, 'avatars');
const coversDir = path.join(uploadsDir, 'covers');
const adsDir = path.join(uploadsDir, 'ads');
const documentsDir = path.join(uploadsDir, 'documents');
const messagesDir = path.join(uploadsDir, 'messages');
const businessVerificationDir = path.join(uploadsDir, 'business_verification');
const individualVerificationDir = path.join(uploadsDir, 'individual_verification');

[avatarsDir, coversDir, adsDir, documentsDir, messagesDir, businessVerificationDir, individualVerificationDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// File filter for images only
const imageFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP, AVIF) are allowed'));
  }
};

// Avatar upload configuration
const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `avatar-${uniqueSuffix}${safeExt(file.mimetype, IMAGE_MIME_TO_EXT)}`);
  },
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: MAX_FILE_SIZE, // 5MB limit
  },
  fileFilter: imageFilter,
});

// Cover photo upload configuration
const coverStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, coversDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `cover-${uniqueSuffix}${safeExt(file.mimetype, IMAGE_MIME_TO_EXT)}`);
  },
});

export const uploadCover = multer({
  storage: coverStorage,
  limits: {
    fileSize: MAX_FILE_SIZE, // 5MB limit
  },
  fileFilter: imageFilter,
});

// Ad images upload configuration
const adImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, adsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `ad-${uniqueSuffix}${safeExt(file.mimetype, IMAGE_MIME_TO_EXT)}`);
  },
});

export const uploadAdImages = multer({
  storage: adImageStorage,
  limits: {
    fileSize: MAX_FILE_SIZE, // 5MB limit per image
  },
  fileFilter: imageFilter,
});

// Document upload configuration
const documentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, documentsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `doc-${uniqueSuffix}${safeExt(file.mimetype, DOC_MIME_TO_EXT)}`);
  },
});

export const uploadDocument = multer({
  storage: documentStorage,
  limits: {
    fileSize: MAX_FILE_SIZE, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG) and PDF files are allowed'));
    }
  },
});

// Message image upload configuration
const messageImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, messagesDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user?.userId || 'unknown';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    cb(null, `msg_${userId}_${timestamp}_${randomStr}${safeExt(file.mimetype, IMAGE_MIME_TO_EXT)}`);
  },
});

export const uploadMessageImage = multer({
  storage: messageImageStorage,
  limits: {
    fileSize: MAX_FILE_SIZE, // 5MB limit
  },
  fileFilter: imageFilter,
});

// Business verification document upload configuration
const businessVerificationStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, businessVerificationDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    cb(null, `biz-${timestamp}-${random}${safeExt(file.mimetype, DOC_MIME_TO_EXT)}`);
  },
});

export const uploadBusinessVerification = multer({
  storage: businessVerificationStorage,
  limits: {
    fileSize: MAX_FILE_SIZE, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
      'application/pdf',
    ];
    if (allowedMimes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      // Also check file extension
      const ext = path.extname(file.originalname).toLowerCase();
      const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.pdf'];
      if (allowedExts.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Only images (JPEG, PNG, WEBP, HEIC) and PDF files are allowed'));
      }
    }
  },
});

// Individual verification document upload configuration
const individualVerificationStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, individualVerificationDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const fieldName = file.fieldname;
    let prefix = 'id';
    if (fieldName === 'id_document_front') prefix = 'id-front';
    else if (fieldName === 'id_document_back') prefix = 'id-back';
    else if (fieldName === 'selfie_with_id') prefix = 'selfie';
    cb(null, `${prefix}-${timestamp}-${random}${safeExt(file.mimetype, DOC_MIME_TO_EXT)}`);
  },
});

export const uploadIndividualVerification = multer({
  storage: individualVerificationStorage,
  limits: {
    fileSize: MAX_FILE_SIZE, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
      'application/pdf',
    ];
    if (allowedMimes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      // Also check file extension
      const ext = path.extname(file.originalname).toLowerCase();
      const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.pdf'];
      if (allowedExts.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Only images (JPEG, PNG, WEBP, HEIC) and PDF files are allowed'));
      }
    }
  },
});

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppError } from '../utils/appError';
import { env } from './env.config';

// Ensure upload root and subfolders exist
const baseUploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
const documentsDir = path.join(baseUploadDir, 'documents');
const payslipsDir = path.join(baseUploadDir, 'payslips');

[baseUploadDir, documentsDir, payslipsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, documentsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const sanitizedBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${sanitizedBase}-${uniqueSuffix}${ext}`);
  },
});

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const documentUpload = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024, // e.g. 5MB
  },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        AppError.badRequest(
          `Invalid file format: ${file.mimetype}. Allowed types: PDF, DOC, DOCX, JPEG, PNG, WEBP.`,
        ),
      );
    }
  },
});

import multer from 'multer';
import { Request } from 'express';

/** Maximum allowed PDF file size: 10 MB */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

/**
 * Multer file filter — strictly accepts only application/pdf MIME type.
 * Rejects all other file types with a descriptive 400 error.
 */
const pdfFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(
      Object.assign(new Error('Only PDF files are allowed. Received: ' + file.mimetype), {
        statusCode: 400,
      })
    );
  }
};

/**
 * Multer upload configuration for PDF documents.
 *
 * Uses memoryStorage — no files are written to disk.
 * The file buffer is passed directly to Cloudinary upload stream.
 *
 * Usage: upload.single('pdf') — field name must be 'pdf'
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // Only one file per request
  },
});

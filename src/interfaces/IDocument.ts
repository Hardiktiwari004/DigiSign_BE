import { Document, Types } from 'mongoose';
import { DocumentStatus } from '../constants/documentStatus';

/**
 * Mongoose document interface for the Document model.
 * Tracks the full lifecycle of an uploaded PDF from upload through signing.
 */
export interface IDocument extends Document {
  /** Reference to the user who owns this document */
  ownerId: Types.ObjectId;
  /** Original filename used as the document title */
  title: string;
  /** Cloudinary URL of the original uploaded PDF */
  originalPdfUrl: string;
  /** Cloudinary URL of the signed PDF (populated after signing) */
  signedPdfUrl?: string;
  /** Unique public verification code, e.g. DOC-8F4A92BC */
  verificationCode: string;
  /** Current lifecycle status of the document */
  status: DocumentStatus;
  /** Timestamp when the PDF was uploaded */
  uploadedAt: Date;
  /** Timestamp when the document was signed (set after signing) */
  signedAt?: Date;
  /** Soft delete timestamp — null means document is active */
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

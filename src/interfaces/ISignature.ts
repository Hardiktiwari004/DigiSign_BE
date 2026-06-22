import { Document, Types } from 'mongoose';

/**
 * Mongoose document interface for the Signature model.
 * Stores placement metadata and the signature image URL for each signing action.
 */
export interface ISignature extends Document {
  /** Reference to the Document that was signed */
  documentId: Types.ObjectId;
  /** Reference to the User who performed the signing */
  userId: Types.ObjectId;
  /** Page number (1-indexed) where the signature was placed */
  page: number;
  /** X coordinate of the signature placement on the page */
  x: number;
  /** Y coordinate of the signature placement on the page */
  y: number;
  /** Width of the signature image in PDF units (points) */
  width: number;
  /** Height of the signature image in PDF units (points) */
  height: number;
  /** Cloudinary URL of the uploaded signature PNG image */
  signatureImageUrl: string;
  createdAt: Date;
}

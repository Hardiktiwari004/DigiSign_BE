import { Document, Types } from 'mongoose';

/**
 * Mongoose document interface for a reusable signature asset.
 *
 * A reusable signature stores the uploaded signature image once so the same
 * asset can be selected and used across multiple documents.
 */
export interface IReusableSignature extends Document {
  /** Reference to the user who owns this reusable signature */
  userId: Types.ObjectId;
  /** Human-friendly name shown in the UI, e.g. "John Doe signature" */
  name: string;
  /** Default width to use when the signature is reused */
  defaultWidth: number;
  /** Default height to use when the signature is reused */
  defaultHeight: number;
  /** Cloudinary URL of the uploaded signature image */
  signatureImageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

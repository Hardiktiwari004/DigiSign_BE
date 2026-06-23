import { Schema, model } from 'mongoose';
import { ISignature } from '../interfaces/ISignature';

/**
 * Mongoose schema for the Signature collection.
 *
 * Stores the placement metadata for each signature applied to a document.
 * The signature image is stored in Cloudinary; only the URL is persisted here.
 *
 * Coordinates (x, y, width, height) are in PDF points (1 pt = 1/72 inch).
 */
const signatureSchema = new Schema<ISignature>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reusableSignatureId: {
      type: Schema.Types.ObjectId,
      ref: 'ReusableSignature',
      default: null,
      index: true,
    },
    /** Page number (1-indexed) where the signature is placed */
    page: {
      type: Number,
      required: true,
      min: [1, 'Page number must be at least 1'],
    },
    /** Horizontal position from left edge of the page in points */
    x: {
      type: Number,
      required: true,
    },
    /** Vertical position from bottom edge of the page in points (pdf-lib coordinate system) */
    y: {
      type: Number,
      required: true,
    },
    /** Width of the signature image in points */
    width: {
      type: Number,
      required: true,
      min: [1, 'Signature width must be positive'],
    },
    /** Height of the signature image in points */
    height: {
      type: Number,
      required: true,
      min: [1, 'Signature height must be positive'],
    },
    /** Cloudinary secure URL for the signature PNG image */
    signatureImageUrl: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only track creation time
    versionKey: false,
  }
);

export const Signature = model<ISignature>('Signature', signatureSchema);

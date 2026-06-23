import { Schema, model } from 'mongoose';
import { IReusableSignature } from '../interfaces/IReusableSignature';

/**
 * Mongoose schema for reusable signature assets.
 *
 * These records let a user store a signature image once and reuse it while
 * signing later documents.
 */
const reusableSignatureSchema = new Schema<IReusableSignature>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Signature name is required'],
      trim: true,
      minlength: [2, 'Signature name must be at least 2 characters'],
      maxlength: [100, 'Signature name cannot exceed 100 characters'],
    },
    defaultWidth: {
      type: Number,
      required: [true, 'Default signature width is required'],
      min: [1, 'Default signature width must be positive'],
    },
    defaultHeight: {
      type: Number,
      required: [true, 'Default signature height is required'],
      min: [1, 'Default signature height must be positive'],
    },
    signatureImageUrl: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

reusableSignatureSchema.index({ userId: 1, createdAt: -1 });

export const ReusableSignature = model<IReusableSignature>('ReusableSignature', reusableSignatureSchema);

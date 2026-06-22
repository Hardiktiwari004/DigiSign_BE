import { Schema, model, Query } from 'mongoose';
import { IDocument } from '../interfaces/IDocument';
import { DocumentStatus } from '../constants/documentStatus';

/**
 * Mongoose schema for the Document collection.
 *
 * Design notes:
 * - Soft delete: documents are never hard-deleted. Instead, deletedAt is set.
 * - A pre-find query middleware automatically filters out soft-deleted documents.
 * - verificationCode is a unique public identifier used in the /verify/:code endpoint.
 */
const documentSchema = new Schema<IDocument>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
    },
    originalPdfUrl: {
      type: String,
      required: [true, 'Original PDF URL is required'],
    },
    signedPdfUrl: {
      type: String,
      default: null,
    },
    verificationCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(DocumentStatus),
      default: DocumentStatus.UPLOADED,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    signedAt: {
      type: Date,
      default: null,
    },
    /**
     * Soft delete field.
     * When set, this document is considered deleted and filtered by query middleware.
     */
    deletedAt: {
      type: Date,
      default: null,
      index: { sparse: true }, // Only index documents that have been deleted
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * Global query middleware for soft delete.
 * Automatically excludes soft-deleted documents from all find queries
 * unless explicitly bypassed with { deletedAt: { $exists: true } }.
 */
function excludeDeleted(this: Query<unknown, IDocument>) {
  if (!this.getFilter().deletedAt) {
    this.where({ deletedAt: null });
  }
}

documentSchema.pre('find', excludeDeleted);
documentSchema.pre('findOne', excludeDeleted);
documentSchema.pre('findOneAndUpdate', excludeDeleted);
documentSchema.pre('countDocuments', excludeDeleted);

export const Document = model<IDocument>('Document', documentSchema);

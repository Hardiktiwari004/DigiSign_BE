import { Schema, model } from 'mongoose';
import { IAuditLog } from '../interfaces/IAuditLog';
import { AuditAction } from '../constants/auditActions';

/**
 * Mongoose schema for the AuditLog collection.
 *
 * Design notes:
 * - Both userId and documentId are optional to support:
 *   - Auth-only events (login, register) — no documentId
 *   - Public verification events — no userId
 * - metadata is a flexible Mixed type for action-specific context.
 * - createdAt is indexed descending to optimize "latest logs first" queries.
 * - TTL index is commented out — uncomment and configure for log retention policies.
 */
const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      default: null,
      index: true,
    },
    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: [true, 'Audit action is required'],
      index: true,
    },
    /** Flexible key-value pairs providing action-specific context */
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

// Optimize "latest logs first" sorting — used in admin audit log queries
auditLogSchema.index({ createdAt: -1 });

// Compound index for admin filtering by action + date range
auditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);

import { Document, Types } from 'mongoose';
import { AuditAction } from '../constants/auditActions';

/**
 * Mongoose document interface for the AuditLog model.
 * Captures every significant platform action for compliance and admin visibility.
 */
export interface IAuditLog extends Document {
  /** User who triggered the action (null for anonymous events like public verification) */
  userId?: Types.ObjectId;
  /** Document involved in the action (null for non-document actions like login) */
  documentId?: Types.ObjectId;
  /** The specific action that occurred */
  action: AuditAction;
  /** Arbitrary key-value metadata specific to the action type */
  metadata?: Record<string, unknown>;
  /** IP address of the request originator */
  ipAddress?: string;
  /** User-Agent string from the request headers */
  userAgent?: string;
  createdAt: Date;
}

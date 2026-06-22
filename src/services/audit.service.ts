import { AuditLog } from '../models/AuditLog.model';
import { AuditAction } from '../constants/auditActions';

/**
 * Parameters for creating an audit log entry.
 */
interface AuditLogParams {
  action: AuditAction;
  userId?: string;
  documentId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Audit Service.
 *
 * Provides a single reusable log() method used by all services to record
 * significant platform events for compliance and admin visibility.
 *
 * Design principles:
 * - Audit failures NEVER propagate to the caller. If the audit write fails
 *   (e.g., DB connection blip), it logs to console but does NOT throw.
 *   This ensures that a failing audit never blocks a core business operation.
 * - Fire-and-forget pattern — no await needed by callers (though awaiting is safe).
 */
export const auditService = {
  /**
   * Creates an audit log record for a platform event.
   *
   * @example
   * await auditService.log({
   *   action: AuditAction.DOCUMENT_UPLOADED,
   *   userId: req.user.id,
   *   documentId: document._id.toString(),
   *   metadata: { title: document.title, verificationCode: document.verificationCode },
   *   ipAddress: req.ip,
   *   userAgent: req.headers['user-agent'],
   * });
   */
  log: async (params: AuditLogParams): Promise<void> => {
    try {
      await AuditLog.create({
        action: params.action,
        userId: params.userId ?? null,
        documentId: params.documentId ?? null,
        metadata: params.metadata ?? {},
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
      });
    } catch (error) {
      // Audit failures are non-critical — log to console but never throw
      console.error(`⚠️  Audit log failed for action [${params.action}]:`, error);
    }
  },
};

import { Document } from '../models/Document.model';
import { User } from '../models/User.model';
import { auditService } from './audit.service';
import { AuditAction } from '../constants/auditActions';
import { DocumentStatus } from '../constants/documentStatus';

/**
 * Public document verification result.
 */
export interface VerificationResult {
  valid: boolean;
  documentName?: string;
  signedBy?: string;
  uploadedAt?: Date;
  signedAt?: Date;
}

interface AuditContext {
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Verification Service.
 * Allows anyone with a DOC-XXXXXXXX code to check if a document is authentic and signed.
 */
export const verificationService = {
  /**
   * Verifies a document by its public verification code.
   *
   * @param verificationCode The unique code (e.g., DOC-8F4A92BC)
   * @param ctx Context for audit logging
   * @returns VerificationResult (valid: true/false + metadata)
   */
  verifyDocument: async (
    verificationCode: string,
    ctx: AuditContext
  ): Promise<VerificationResult> => {
    // Look up the document by code
    const document = await Document.findOne({ verificationCode });

    // Document doesn't exist, has been soft-deleted, or hasn't been signed yet
    if (!document || document.status !== DocumentStatus.SIGNED) {
      return { valid: false };
    }

    // Retrieve the signer's name
    const owner = await User.findById(document.ownerId).select('name');

    // Log the public verification event
    // userId is intentionally left undefined since this is a public endpoint
    await auditService.log({
      action: AuditAction.DOCUMENT_VERIFIED,
      documentId: document._id.toString(),
      metadata: { verificationCode },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return {
      valid: true,
      documentName: document.title,
      signedBy: owner ? owner.name : 'Unknown User',
      uploadedAt: document.uploadedAt,
      signedAt: document.signedAt,
    };
  },
};

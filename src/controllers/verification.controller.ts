import { Request, Response, NextFunction } from 'express';
import { verificationService } from '../services/verification.service';
import { sendSuccess } from '../utils/apiResponse.util';

/**
 * Verification Controller — public document verification endpoint.
 * No authentication required.
 */
export const verificationController = {
  /**
   * GET /api/verify/:verificationCode
   * Verifies a document by its public verification code.
   * Returns validity status and document metadata.
   *
   * Example response (valid):
   * {
   *   "valid": true,
   *   "documentName": "Agreement.pdf",
   *   "signedBy": "John Doe",
   *   "signedAt": "2026-06-22T00:00:00.000Z"
   * }
   *
   * Example response (not found):
   * { "valid": false }
   */
  verifyDocument: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { verificationCode } = req.params;
      const ctx = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };

      const result = await verificationService.verifyDocument(verificationCode, ctx);

      sendSuccess(
        res,
        result.valid ? 'Document verified successfully' : 'Document not found or not yet signed',
        result
      );
    } catch (error) {
      next(error);
    }
  },
};

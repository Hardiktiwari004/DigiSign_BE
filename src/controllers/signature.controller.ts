import { Request, Response, NextFunction } from 'express';
import { signatureService } from '../services/signature.service';
import { sendSuccess } from '../utils/apiResponse.util';
import { SignDocumentDto } from '../validators/signature.validator';

/**
 * Signature Controller — handles the document signing endpoint.
 */
export const signatureController = {
  /**
   * POST /api/documents/:id/sign
   * Signs a document with a provided signature image at the specified coordinates.
   *
   * This triggers the full signing workflow:
   * 1. Signature image → Cloudinary
   * 2. pdf-lib embeds signature + footer onto the original PDF
   * 3. Signed PDF → Cloudinary
   * 4. Document status → SIGNED
   * 5. Audit log created
   */
  signDocument: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id: documentId } = req.params;
      const userId = req.user!.id;
      const dto = req.body as SignDocumentDto;
      const ctx = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };

      const signature = await signatureService.signDocument(documentId, userId, dto, ctx);

      sendSuccess(res, 'Document signed successfully', { signature }, 201);
    } catch (error) {
      next(error);
    }
  },
};

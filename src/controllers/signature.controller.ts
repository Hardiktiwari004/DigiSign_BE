import { Request, Response, NextFunction } from 'express';
import { signatureService } from '../services/signature.service';
import { sendSuccess, sendError } from '../utils/apiResponse.util';
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

      const reusableSignatureId = req.body?.reusableSignatureId;

      if (!req.file && !reusableSignatureId) {
        sendError(
          res,
          'A signature image file or reusableSignatureId is required.',
          ['signatureImage: File is missing', 'reusableSignatureId: Value is missing'],
          400
        );
        return;
      }

      // Convert uploaded file to base64 Data URI when the request uses a fresh signature upload.
      const signatureImageBase64 = req.file
        ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
        : undefined;

      const dto = {
        ...req.body,
        signatureImageBase64,
      } as SignDocumentDto;

      const ctx = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };

      const signature = await signatureService.signDocument(documentId, userId, dto, ctx);

      sendSuccess(res, 'Document signed successfully', { signature }, 201);
    } catch (error) {
      next(error);
    }
  },
};

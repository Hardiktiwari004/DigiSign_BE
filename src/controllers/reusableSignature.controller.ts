import { NextFunction, Request, Response } from 'express';
import { sendError, sendSuccess } from '../utils/apiResponse.util';
import { CreateReusableSignatureDto } from '../validators/reusableSignature.validator';
import { reusableSignatureService } from '../services/reusableSignature.service';

/**
 * Reusable Signature Controller.
 * Handles HTTP transport for reusable signature asset management.
 */
export const reusableSignatureController = {
  /**
   * POST /api/signatures/reusable
   * Stores a signature image once so it can be reused later.
   */
  createReusableSignature: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        sendError(res, 'Signature image file is required.', ['signatureImage: File is missing'], 400);
        return;
      }

      const userId = req.user!.id;
      const dto = req.body as CreateReusableSignatureDto;
      const ctx = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };

      const reusableSignature = await reusableSignatureService.createReusableSignature(userId, dto, req.file, ctx);

      sendSuccess(res, 'Reusable signature created successfully', { reusableSignature }, 201);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/signatures/reusable
   * Lists the current user's reusable signatures.
   */
  listReusableSignatures: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const reusableSignatures = await reusableSignatureService.listReusableSignatures(userId);

      sendSuccess(res, 'Reusable signatures retrieved successfully', { reusableSignatures });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/signatures/reusable/:id
   * Deletes one reusable signature asset.
   */
  deleteReusableSignature: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const ctx = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };

      await reusableSignatureService.deleteReusableSignature(id, userId, userRole, ctx);

      sendSuccess(res, 'Reusable signature deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};

import { Request, Response, NextFunction } from 'express';
import { documentService } from '../services/document.service';
import { sendSuccess } from '../utils/apiResponse.util';
import { GetDocumentsQuery } from '../validators/document.validator';
import { auditService } from '../services/audit.service';
import { AuditAction } from '../constants/auditActions';

/**
 * Document Controller — thin HTTP layer for document management endpoints.
 */
export const documentController = {
  /**
   * POST /api/documents/upload
   * Accepts a PDF file via multipart/form-data and stores it in Cloudinary.
   */
  uploadDocument: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'PDF file is required', errors: ['No file uploaded'] });
        return;
      }

      const userId = req.user!.id;
      const ctx = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };

      const document = await documentService.uploadDocument(userId, req.file, ctx);

      sendSuccess(res, 'Document uploaded successfully', { document }, 201);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/documents
   * Returns a paginated list of the authenticated user's documents.
   */
  getUserDocuments: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const query = req.query as unknown as GetDocumentsQuery;

      const result = await documentService.getUserDocuments(userId, query);

      sendSuccess(res, 'Documents retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/documents/admin/all
   * Returns a paginated list of all documents in the system (admin only).
   */
  getAllDocuments: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as GetDocumentsQuery;

      const result = await documentService.getAllDocuments(query);

      sendSuccess(res, 'All documents retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/documents/:id
   * Returns a single document — only accessible by the owner or an ADMIN.
   */
  getDocumentById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const ctx = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };

      const document = await documentService.getDocumentById(id, userId, userRole, ctx);

      sendSuccess(res, 'Document retrieved successfully', { document });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/documents/:id
   * Soft deletes a document. Sets deletedAt timestamp.
   */
  deleteDocument: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const ctx = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };

      await documentService.deleteDocument(id, userId, userRole, ctx);

      sendSuccess(res, 'Document deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/documents/:id/download
   * Records a download audit event and returns the signed PDF URL for redirect.
   */
  downloadDocument: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const ctx = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };

      const document = await documentService.getDocumentById(id, userId, userRole, ctx);

      if (!document.signedPdfUrl) {
        res.status(400).json({
          success: false,
          message: 'This document has not been signed yet and cannot be downloaded.',
          errors: [],
        });
        return;
      }

      await auditService.log({
        action: AuditAction.DOCUMENT_DOWNLOADED,
        userId,
        documentId: document._id.toString(),
        metadata: { title: document.title },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      sendSuccess(res, 'Download URL generated', { downloadUrl: document.signedPdfUrl });
    } catch (error) {
      next(error);
    }
  },
};

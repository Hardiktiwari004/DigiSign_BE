import { Document } from '../models/Document.model';
import { IDocument } from '../interfaces/IDocument';
import { uploadPdfToCloudinary } from '../utils/cloudinary.util';
import { generateVerificationCode } from '../utils/verificationCode.util';
import { auditService } from './audit.service';
import { AuditAction } from '../constants/auditActions';
import { GetDocumentsQuery } from '../validators/document.validator';
import { UserRole } from '../constants/userRoles';
import { FilterQuery } from 'mongoose';

/**
 * Context passed from controller for audit logging.
 */
interface AuditContext {
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Paginated documents result.
 */
export interface PaginatedDocuments {
  items: IDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Document Service.
 * Handles the core business logic for PDF uploads, retrieval, and deletion.
 */
export const documentService = {
  /**
   * Uploads a new PDF document.
   * 1. Streams buffer to Cloudinary
   * 2. Generates a unique DOC-XXXXXXXX verification code
   * 3. Creates Document record in MongoDB
   * 4. Logs audit event
   */
  uploadDocument: async (
    userId: string,
    file: Express.Multer.File,
    ctx: AuditContext
  ): Promise<IDocument> => {
    // 1. Upload to Cloudinary (returns secure URL)
    const originalPdfUrl = await uploadPdfToCloudinary(file.buffer);

    // 2. Generate unique verification code
    // In a high-throughput system, you'd want a retry mechanism here for collisions,
    // but DOC-XXXXXXXX (8 hex chars) has 4.2 billion combinations.
    const verificationCode = generateVerificationCode();

    // 3. Save to database
    const document = await Document.create({
      ownerId: userId,
      title: file.originalname,
      originalPdfUrl,
      verificationCode,
    });

    // 4. Fire-and-forget audit log
    await auditService.log({
      action: AuditAction.DOCUMENT_UPLOADED,
      userId,
      documentId: document._id.toString(),
      metadata: { title: document.title, verificationCode },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return document;
  },

  /**
   * Retrieves a paginated list of documents owned by the user.
   * Supports search by title/status and dynamic sorting.
   */
  getUserDocuments: async (userId: string, query: GetDocumentsQuery): Promise<PaginatedDocuments> => {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const filter: FilterQuery<IDocument> = { ownerId: userId };

    if (query.search) {
      // Case-insensitive regex search on title or verification code
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { verificationCode: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.status) {
      filter.status = query.status;
    }

    // Dynamic sorting (e.g. { uploadedAt: -1 })
    const sortField = query.sortBy ?? 'uploadedAt';
    const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortDirection };

    const [items, total] = await Promise.all([
      Document.find(filter)
        .sort(sort as any)
        .skip(skip)
        .limit(limit)
        .lean(),
      Document.countDocuments(filter),
    ]);

    return {
      items: items as unknown as IDocument[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Retrieves a single document by ID.
   * Enforces ownership authorization (owner or ADMIN).
   * Generates a DOCUMENT_VIEWED audit log.
   */
  getDocumentById: async (
    documentId: string,
    userId: string,
    userRole: UserRole,
    ctx: AuditContext
  ): Promise<IDocument> => {
    const document = await Document.findById(documentId);

    if (!document) {
      const err = new Error('Document not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }

    // Authorization check
    if (document.ownerId.toString() !== userId && userRole !== UserRole.ADMIN) {
      const err = new Error('You do not have permission to access this document') as Error & { statusCode: number };
      err.statusCode = 403;
      throw err;
    }

    await auditService.log({
      action: AuditAction.DOCUMENT_VIEWED,
      userId,
      documentId: document._id.toString(),
      metadata: { title: document.title },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return document;
  },

  /**
   * Soft deletes a document by setting deletedAt.
   * Enforces ownership authorization.
   */
  deleteDocument: async (
    documentId: string,
    userId: string,
    userRole: UserRole,
    ctx: AuditContext
  ): Promise<void> => {
    const document = await Document.findById(documentId);

    if (!document) {
      const err = new Error('Document not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }

    if (document.ownerId.toString() !== userId && userRole !== UserRole.ADMIN) {
      const err = new Error('You do not have permission to delete this document') as Error & { statusCode: number };
      err.statusCode = 403;
      throw err;
    }

    // Soft delete
    document.deletedAt = new Date();
    await document.save();

    await auditService.log({
      action: AuditAction.DOCUMENT_DELETED,
      userId,
      documentId: document._id.toString(),
      metadata: { title: document.title },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
  },
};

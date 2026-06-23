import { Document } from '../models/Document.model';
import { Signature } from '../models/Signature.model';
import { ReusableSignature } from '../models/ReusableSignature.model';
import { User } from '../models/User.model';
import { ISignature } from '../interfaces/ISignature';
import { pdfService } from './pdf.service';
import { uploadPdfToCloudinary, uploadImageToCloudinary } from '../utils/cloudinary.util';
import { auditService } from './audit.service';
import { AuditAction } from '../constants/auditActions';
import { DocumentStatus } from '../constants/documentStatus';
import { SignDocumentDto } from '../validators/signature.validator';
import { UserRole } from '../constants/userRoles';

interface AuditContext {
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Signature Service.
 * Orchestrates the document signing workflow: metadata validation, PDF manipulation, and Cloudinary uploads.
 */
export const signatureService = {
  /**
   * Signs a document.
   * @param documentId The ID of the document to sign
   * @param userId The ID of the user signing the document
   * @param dto Coordinates and base64 signature image
   * @param ctx Audit context
   */
  signDocument: async (
    documentId: string,
    userId: string,
    dto: SignDocumentDto,
    ctx: AuditContext
  ): Promise<ISignature> => {
    // 1. Fetch document and verify ownership/status
    const document = await Document.findById(documentId);
    if (!document) {
      const err = new Error('Document not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }

    // Fetch user early to check role and get the signer's name for the PDF footer
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('User not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }

    if (document.ownerId.toString() !== userId && user.role !== UserRole.ADMIN) {
      const err = new Error('You do not have permission to sign this document') as Error & { statusCode: number };
      err.statusCode = 403;
      throw err;
    }

    if (document.status === DocumentStatus.SIGNED) {
      const err = new Error('Document is already signed') as Error & { statusCode: number };
      err.statusCode = 400;
      throw err;
    }

    let signatureImageUrl: string;
    let reusableSignatureId: string | null = null;
    let width = dto.width;
    let height = dto.height;

    // 2. Use either an uploaded signature image or a reusable signature asset.
    if (dto.reusableSignatureId) {
      const reusableSignature = await ReusableSignature.findById(dto.reusableSignatureId);

      if (!reusableSignature) {
        const err = new Error('Reusable signature not found') as Error & { statusCode: number };
        err.statusCode = 404;
        throw err;
      }

      if (reusableSignature.userId.toString() !== userId && user.role !== UserRole.ADMIN) {
        const err = new Error('You do not have permission to use this reusable signature') as Error & {
          statusCode: number;
        };
        err.statusCode = 403;
        throw err;
      }

      reusableSignatureId = reusableSignature._id.toString();
      signatureImageUrl = reusableSignature.signatureImageUrl;
      width ??= reusableSignature.defaultWidth;
      height ??= reusableSignature.defaultHeight;

      if (width === undefined || height === undefined) {
        const err = new Error('Width and height are required to use this reusable signature') as Error & {
          statusCode: number;
        };
        err.statusCode = 400;
        throw err;
      }
    } else {
      if (!dto.signatureImageBase64) {
        const err = new Error('Signature image file is required') as Error & { statusCode: number };
        err.statusCode = 400;
        throw err;
      }

      signatureImageUrl = await uploadImageToCloudinary(dto.signatureImageBase64);
    }

    // 3. Delegate to pdfService to embed the signature and footer
    const signedPdfBuffer = await pdfService.signPdf({
      originalPdfUrl: document.originalPdfUrl,
      signatureImageSource: dto.reusableSignatureId ? signatureImageUrl : dto.signatureImageBase64!,
      page: dto.page,
      x: dto.x,
      y: dto.y,
      width: width as number,
      height: height as number,
      verificationCode: document.verificationCode,
      signerName: user.name,
    });

    // 4. Upload the modified, signed PDF buffer to Cloudinary
    const signedPdfUrl = await uploadPdfToCloudinary(signedPdfBuffer);

    // 5. Save the signature placement metadata to the database
    const signature = await Signature.create({
      documentId: document._id,
      userId,
      reusableSignatureId: reusableSignatureId ? reusableSignatureId : null,
      page: dto.page,
      x: dto.x,
      y: dto.y,
      width: width as number,
      height: height as number,
      signatureImageUrl,
    });

    // 6. Update the Document status to SIGNED
    document.status = DocumentStatus.SIGNED;
    document.signedPdfUrl = signedPdfUrl;
    document.signedAt = new Date();
    await document.save();

    // 7. Fire-and-forget audit log
    await auditService.log({
      action: AuditAction.DOCUMENT_SIGNED,
      userId,
      documentId: document._id.toString(),
      metadata: {
        title: document.title,
        verificationCode: document.verificationCode,
        page: dto.page,
        reusableSignatureId,
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return signature;
  },
};

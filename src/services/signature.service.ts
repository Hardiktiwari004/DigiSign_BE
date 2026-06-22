import { Document } from '../models/Document.model';
import { Signature } from '../models/Signature.model';
import { User } from '../models/User.model';
import { ISignature } from '../interfaces/ISignature';
import { pdfService } from './pdf.service';
import { uploadPdfToCloudinary, uploadImageToCloudinary } from '../utils/cloudinary.util';
import { auditService } from './audit.service';
import { AuditAction } from '../constants/auditActions';
import { DocumentStatus } from '../constants/documentStatus';
import { SignDocumentDto } from '../validators/signature.validator';

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

    if (document.ownerId.toString() !== userId) {
      const err = new Error('You do not have permission to sign this document') as Error & { statusCode: number };
      err.statusCode = 403;
      throw err;
    }

    if (document.status === DocumentStatus.SIGNED) {
      const err = new Error('Document is already signed') as Error & { statusCode: number };
      err.statusCode = 400;
      throw err;
    }

    // Fetch user for the signer's name (used in the PDF footer)
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // 2. Upload the raw signature image to Cloudinary (for record keeping)
    const signatureImageUrl = await uploadImageToCloudinary(dto.signatureImageBase64);
    
    // 3. Delegate to pdfService to embed the signature and footer
    const signedPdfBuffer = await pdfService.signPdf({
      originalPdfUrl: document.originalPdfUrl,
      signatureImageBase64: dto.signatureImageBase64,
      page: dto.page,
      x: dto.x,
      y: dto.y,
      width: dto.width,
      height: dto.height,
      verificationCode: document.verificationCode,
      signerName: user.name,
    });

    // 4. Upload the modified, signed PDF buffer to Cloudinary
    const signedPdfUrl = await uploadPdfToCloudinary(signedPdfBuffer);

    // 5. Save the signature placement metadata to the database
    const signature = await Signature.create({
      documentId: document._id,
      userId,
      page: dto.page,
      x: dto.x,
      y: dto.y,
      width: dto.width,
      height: dto.height,
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
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return signature;
  },
};

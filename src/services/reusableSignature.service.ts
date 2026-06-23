import { ReusableSignature } from '../models/ReusableSignature.model';
import { IReusableSignature } from '../interfaces/IReusableSignature';
import { uploadImageToCloudinary } from '../utils/cloudinary.util';
import { auditService } from './audit.service';
import { AuditAction } from '../constants/auditActions';
import { CreateReusableSignatureDto } from '../validators/reusableSignature.validator';
import { UserRole } from '../constants/userRoles';

interface AuditContext {
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Reusable Signature Service.
 * Handles creation, listing, lookup, and deletion of reusable signature assets.
 */
export const reusableSignatureService = {
  /**
   * Stores a new reusable signature image and returns the saved record.
   */
  createReusableSignature: async (
    userId: string,
    dto: CreateReusableSignatureDto,
    file: Express.Multer.File,
    ctx: AuditContext
  ): Promise<IReusableSignature> => {
    const signatureImageBase64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const signatureImageUrl = await uploadImageToCloudinary(signatureImageBase64);

    const reusableSignature = await ReusableSignature.create({
      userId,
      name: dto.name,
      defaultWidth: dto.defaultWidth,
      defaultHeight: dto.defaultHeight,
      signatureImageUrl,
    });

    await auditService.log({
      action: AuditAction.REUSABLE_SIGNATURE_CREATED,
      userId,
      metadata: {
        reusableSignatureId: reusableSignature._id.toString(),
        name: reusableSignature.name,
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return reusableSignature;
  },

  /**
   * Returns all reusable signatures owned by the current user.
   */
  listReusableSignatures: async (userId: string): Promise<IReusableSignature[]> => {
    return ReusableSignature.find({ userId }).sort({ createdAt: -1 });
  },

  /**
   * Looks up a reusable signature and verifies the caller owns it.
   */
  getReusableSignatureById: async (
    reusableSignatureId: string,
    userId: string,
    userRole: UserRole
  ): Promise<IReusableSignature> => {
    const reusableSignature = await ReusableSignature.findById(reusableSignatureId);

    if (!reusableSignature) {
      const err = new Error('Reusable signature not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }

    if (reusableSignature.userId.toString() !== userId && userRole !== UserRole.ADMIN) {
      const err = new Error('You do not have permission to access this reusable signature') as Error & {
        statusCode: number;
      };
      err.statusCode = 403;
      throw err;
    }

    return reusableSignature;
  },

  /**
   * Deletes a reusable signature asset.
   */
  deleteReusableSignature: async (
    reusableSignatureId: string,
    userId: string,
    userRole: UserRole,
    ctx: AuditContext
  ): Promise<void> => {
    const reusableSignature = await ReusableSignature.findById(reusableSignatureId);

    if (!reusableSignature) {
      const err = new Error('Reusable signature not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }

    if (reusableSignature.userId.toString() !== userId && userRole !== UserRole.ADMIN) {
      const err = new Error('You do not have permission to delete this reusable signature') as Error & {
        statusCode: number;
      };
      err.statusCode = 403;
      throw err;
    }

    await reusableSignature.deleteOne();

    await auditService.log({
      action: AuditAction.REUSABLE_SIGNATURE_DELETED,
      userId,
      metadata: {
        reusableSignatureId: reusableSignature._id.toString(),
        name: reusableSignature.name,
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
  },
};

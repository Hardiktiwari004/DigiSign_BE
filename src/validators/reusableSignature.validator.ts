import { z } from 'zod';
import { Types } from 'mongoose';

/**
 * Validates the payload used to create a reusable signature asset.
 */
export const createReusableSignatureSchema = z.object({
  name: z.string().trim().min(2, 'Signature name must be at least 2 characters').max(100),
  defaultWidth: z.coerce.number().positive('Default width must be positive'),
  defaultHeight: z.coerce.number().positive('Default height must be positive'),
});

export type CreateReusableSignatureDto = z.infer<typeof createReusableSignatureSchema>;

/**
 * Validates a reusable signature MongoDB ObjectId parameter.
 */
export const reusableSignatureIdParamSchema = z.object({
  id: z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: 'Invalid reusable signature ID format',
  }),
});

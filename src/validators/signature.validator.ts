import { z } from 'zod';

/**
 * Schema for signing a document.
 * Requires the exact coordinates/dimensions of the signature image
 * and the image itself encoded as a base64 string.
 */
export const signDocumentSchema = z.object({
  page: z.number().int().min(1, 'Page number must be at least 1'),

  x: z.number().min(0, 'X coordinate cannot be negative'),
  y: z.number().min(0, 'Y coordinate cannot be negative'),
  width: z.number().positive('Width must be positive'),
  height: z.number().positive('Height must be positive'),

  /**
   * Validates that the provided string is a valid Data URI for an image.
   * Format: data:image/[png|jpeg|jpg];base64,[data]
   */
  signatureImageBase64: z
    .string()
    .min(1, 'Signature image is required')
    .regex(
      /^data:image\/(png|jpeg|jpg);base64,([A-Za-z0-9+/=])+$/,
      'Must be a valid base64 encoded PNG or JPG image'
    ),
});

export type SignDocumentDto = z.infer<typeof signDocumentSchema>;

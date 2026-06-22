import { z } from 'zod';

/**
 * Schema for signing a document.
 * Requires the coordinates/dimensions of the signature image.
 * Parameters are coerced to numbers since they are uploaded via multipart form fields.
 */
export const signDocumentSchema = z.object({
  page: z.coerce.number().int().min(1, 'Page number must be at least 1').default(1),
  x: z.coerce.number().min(0, 'X coordinate cannot be negative'),
  y: z.coerce.number().min(0, 'Y coordinate cannot be negative'),
  width: z.coerce.number().positive('Width must be positive'),
  height: z.coerce.number().positive('Height must be positive'),
});

export type SignDocumentDto = z.infer<typeof signDocumentSchema> & {
  signatureImageBase64: string;
};

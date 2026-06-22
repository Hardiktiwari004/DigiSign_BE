import { z } from 'zod';
import { DocumentStatus } from '../constants/documentStatus';
import { Types } from 'mongoose';

/**
 * Validates pagination, search, and sorting query parameters for listing documents.
 * All properties are optional and provide safe defaults during data retrieval.
 */
export const getDocumentsQuerySchema = z.object({
  /** Converts string query params to numbers (e.g., "?page=2" -> 2) */
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),

  search: z.string().max(100).optional(),
  status: z.nativeEnum(DocumentStatus).optional(),

  sortBy: z.enum(['uploadedAt', 'title', 'status', 'signedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type GetDocumentsQuery = z.infer<typeof getDocumentsQuerySchema>;

/**
 * Validates that an Express URL parameter is a valid MongoDB ObjectId.
 */
export const documentIdParamSchema = z.object({
  id: z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: 'Invalid document ID format',
  }),
});

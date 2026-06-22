import { Router } from 'express';
import { documentController } from '../controllers/document.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { upload } from '../middleware/upload.middleware';
import {
  getDocumentsQuerySchema,
  documentIdParamSchema,
} from '../validators/document.validator';

const router = Router();

// All document routes require authentication
router.use(authenticate);

/**
 * @openapi
 * tags:
 *   name: Documents
 *   description: Document upload and management
 */

/**
 * @openapi
 * /api/documents/upload:
 *   post:
 *     summary: Upload a PDF document
 *     tags: [Documents]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               pdf:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/upload', upload.single('pdf'), documentController.uploadDocument);

/**
 * @openapi
 * /api/documents:
 *   get:
 *     summary: Get all documents for the authenticated user
 *     tags: [Documents]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: 'number' }
 *       - in: query
 *         name: limit
 *         schema: { type: 'number' }
 *       - in: query
 *         name: search
 *         schema: { type: 'string' }
 *       - in: query
 *         name: status
 *         schema: { type: 'string' }
 *     responses:
 *       200:
 *         description: Documents retrieved
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', validate(getDocumentsQuerySchema, 'query'), documentController.getUserDocuments);

/**
 * @openapi
 * /api/documents/{id}:
 *   get:
 *     summary: Get a single document by ID
 *     tags: [Documents]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
 *     responses:
 *       200:
 *         description: Document retrieved
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/:id',
  validate(documentIdParamSchema, 'params'),
  documentController.getDocumentById
);

/**
 * @openapi
 * /api/documents/{id}/download:
 *   get:
 *     summary: Get download URL for the signed PDF
 *     tags: [Documents]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
 *     responses:
 *       200:
 *         description: Download URL generated
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/:id/download',
  validate(documentIdParamSchema, 'params'),
  documentController.downloadDocument
);

/**
 * @openapi
 * /api/documents/{id}:
 *   delete:
 *     summary: Soft delete a document
 *     tags: [Documents]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  '/:id',
  validate(documentIdParamSchema, 'params'),
  documentController.deleteDocument
);

export default router;

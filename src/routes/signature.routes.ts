import { Router } from 'express';
import { signatureController } from '../controllers/signature.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { documentIdParamSchema } from '../validators/document.validator';
import { signDocumentSchema } from '../validators/signature.validator';
import { uploadSignature } from '../middleware/upload.middleware';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Signatures
 *   description: Document signing endpoints
 */

/**
 * @openapi
 * /api/documents/{id}/sign:
 *   post:
 *     summary: Sign a document
 *     tags: [Signatures]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [x, y, width, height, signatureImage]
 *             properties:
 *               page: { type: 'integer', default: 1, description: 'Page number (1-indexed)' }
 *               x: { type: 'number', description: 'X coordinate' }
 *               y: { type: 'number', description: 'Y coordinate' }
 *               width: { type: 'number', description: 'Width of signature' }
 *               height: { type: 'number', description: 'Height of signature' }
 *               signatureImage: { type: 'string', format: 'binary', description: 'PNG/JPG/JPEG signature image file' }
 *     responses:
 *       201:
 *         description: Document signed successfully
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/:id/sign',
  authenticate,
  uploadSignature.single('signatureImage'),
  validate(documentIdParamSchema, 'params'),
  validate(signDocumentSchema, 'body'),
  signatureController.signDocument
);

export default router;

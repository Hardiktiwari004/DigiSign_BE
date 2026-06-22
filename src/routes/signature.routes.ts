import { Router } from 'express';
import { signatureController } from '../controllers/signature.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { documentIdParamSchema } from '../validators/document.validator';
import { signDocumentSchema } from '../validators/signature.validator';

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
 *         application/json:
 *           schema:
 *             type: object
 *             required: [page, x, y, width, height, signatureImageBase64]
 *             properties:
 *               page: { type: 'number' }
 *               x: { type: 'number' }
 *               y: { type: 'number' }
 *               width: { type: 'number' }
 *               height: { type: 'number' }
 *               signatureImageBase64: { type: 'string' }
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
  validate(documentIdParamSchema, 'params'),
  validate(signDocumentSchema, 'body'),
  signatureController.signDocument
);

export default router;

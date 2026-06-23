import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { uploadSignature } from '../middleware/upload.middleware';
import { reusableSignatureController } from '../controllers/reusableSignature.controller';
import {
  createReusableSignatureSchema,
  reusableSignatureIdParamSchema,
} from '../validators/reusableSignature.validator';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * tags:
 *   name: Reusable Signatures
 *   description: Saved signature assets that can be reused while signing documents
 */

/**
 * @openapi
 * /api/signatures/reusable:
 *   post:
 *     summary: Create a reusable signature
 *     tags: [Reusable Signatures]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, defaultWidth, defaultHeight, signatureImage]
 *             properties:
 *               name: { type: 'string', description: 'Display name for the signature' }
 *               defaultWidth: { type: 'number', description: 'Default width in PDF points' }
 *               defaultHeight: { type: 'number', description: 'Default height in PDF points' }
 *               signatureImage: { type: 'string', format: 'binary', description: 'PNG/JPG/JPEG signature image file' }
 *     responses:
 *       201:
 *         description: Reusable signature created successfully
 */
router.post(
  '/reusable',
  uploadSignature.single('signatureImage'),
  validate(createReusableSignatureSchema, 'body'),
  reusableSignatureController.createReusableSignature
);

/**
 * @openapi
 * /api/signatures/reusable:
 *   get:
 *     summary: List reusable signatures
 *     tags: [Reusable Signatures]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Reusable signatures retrieved successfully
 */
router.get('/reusable', reusableSignatureController.listReusableSignatures);

/**
 * @openapi
 * /api/signatures/reusable/{id}:
 *   delete:
 *     summary: Delete a reusable signature
 *     tags: [Reusable Signatures]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
 *     responses:
 *       200:
 *         description: Reusable signature deleted successfully
 */
router.delete(
  '/reusable/:id',
  validate(reusableSignatureIdParamSchema, 'params'),
  reusableSignatureController.deleteReusableSignature
);

export default router;

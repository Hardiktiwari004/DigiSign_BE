import { Router } from 'express';
import { verificationController } from '../controllers/verification.controller';
import { verifyLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Verification
 *   description: Public document verification
 */

/**
 * @openapi
 * /api/verify/{verificationCode}:
 *   get:
 *     summary: Verify a document's authenticity
 *     tags: [Verification]
 *     parameters:
 *       - in: path
 *         name: verificationCode
 *         required: true
 *         schema: { type: 'string' }
 *     responses:
 *       200:
 *         description: Verification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: 'boolean' }
 *                 message: { type: 'string' }
 *                 data:
 *                   type: object
 *                   properties:
 *                     valid: { type: 'boolean' }
 *                     documentName: { type: 'string' }
 *                     signedBy: { type: 'string' }
 *                     uploadedAt: { type: 'string', format: 'date-time' }
 *                     signedAt: { type: 'string', format: 'date-time' }
 *       429:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:verificationCode', verifyLimiter, verificationController.verifyDocument);

export default router;

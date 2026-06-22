import { Router } from 'express';
import authRoutes from './auth.routes';
import documentRoutes from './document.routes';
import signatureRoutes from './signature.routes';
import verificationRoutes from './verification.routes';
import adminRoutes from './admin.routes';

const router = Router();

/**
 * API Route Registry.
 * All routes are prefixed with /api (set in app.ts).
 */
router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/documents', signatureRoutes);   // Shares /documents prefix for POST /:id/sign
router.use('/verify', verificationRoutes);
router.use('/admin', adminRoutes);

export default router;

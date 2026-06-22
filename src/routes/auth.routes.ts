import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { authLimiter } from '../middleware/rateLimiter.middleware';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from '../validators/auth.validator';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Auth
 *   description: Authentication and User management
 */

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: 'string' }
 *               email: { type: 'string', format: 'email' }
 *               password: { type: 'string', minLength: 8 }
 *               role: { type: 'string', enum: ['USER', 'ADMIN'] }
 *     responses:
 *       201:
 *         description: Account created successfully
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/register',
  authLimiter,
  validate(registerSchema, 'body'),
  authController.register
);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login and receive a JWT access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: 'string', format: 'email' }
 *               password: { type: 'string' }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/login',
  authLimiter,
  validate(loginSchema, 'body'),
  authController.login
);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token using a refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: 'string' }
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 'Token refreshed successfully' }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken: { type: string }
 *                     refreshToken: { type: string }
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/refresh',
  authLimiter,
  validate(refreshTokenSchema, 'body'),
  authController.refresh
);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Logout and invalidate refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: 'string' }
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/logout',
  authLimiter,
  validate(refreshTokenSchema, 'body'),
  authController.logout
);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user's profile
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: 'string', format: 'email' }
 *     responses:
 *       200:
 *         description: Reset token generated
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema, 'body'),
  authController.forgotPassword
);

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using a valid reset token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token: { type: 'string', format: 'uuid' }
 *               newPassword: { type: 'string', minLength: 8 }
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/reset-password',
  validate(resetPasswordSchema, 'body'),
  authController.resetPassword
);

export default router;

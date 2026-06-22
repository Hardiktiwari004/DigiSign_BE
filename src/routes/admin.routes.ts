import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { UserRole } from '../constants/userRoles';

const router = Router();

// All admin routes require authentication AND ADMIN role
router.use(authenticate, requireRole(UserRole.ADMIN));

/**
 * @openapi
 * tags:
 *   name: Admin
 *   description: Administrator dashboard and audit logs
 */

/**
 * @openapi
 * /api/admin/stats:
 *   get:
 *     summary: Get platform-wide dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: 'boolean', example: true }
 *                 message: { type: 'string' }
 *                 data:
 *                   type: object
 *                   properties:
 *                     users: { type: 'number' }
 *                     documents: { type: 'number' }
 *                     signedDocuments: { type: 'number' }
 *                     auditLogs: { type: 'number' }
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/stats', adminController.getDashboardStats);

/**
 * @openapi
 * /api/admin/audit-logs:
 *   get:
 *     summary: Get paginated and filterable audit log entries
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: 'number' }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: 'number' }
 *         description: Results per page
 *       - in: query
 *         name: action
 *         schema: { type: 'string' }
 *         description: Audit action (e.g. USER_LOGIN)
 *       - in: query
 *         name: userId
 *         schema: { type: 'string' }
 *         description: Filter by user ID
 *       - in: query
 *         name: startDate
 *         schema: { type: 'string', format: 'date-time' }
 *       - in: query
 *         name: endDate
 *         schema: { type: 'string', format: 'date-time' }
 *     responses:
 *       200:
 *         description: Audit logs retrieved
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/audit-logs', adminController.getAuditLogs);

export default router;

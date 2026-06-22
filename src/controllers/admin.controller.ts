import { Request, Response, NextFunction } from 'express';
import { adminService, AuditLogQuery } from '../services/admin.service';
import { sendSuccess } from '../utils/apiResponse.util';
import { AuditAction } from '../constants/auditActions';

/**
 * Admin Controller — admin-only dashboard and audit log endpoints.
 * All routes protected by authenticate + requireRole(ADMIN) middleware.
 */
export const adminController = {
  /**
   * GET /api/admin/stats
   * Returns platform-wide aggregate statistics.
   *
   * Response:
   * {
   *   "users": 120,
   *   "documents": 500,
   *   "signedDocuments": 350,
   *   "auditLogs": 5000
   * }
   */
  getDashboardStats: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await adminService.getDashboardStats();
      sendSuccess(res, 'Dashboard statistics retrieved', stats);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/admin/audit-logs
   * Returns a paginated, filterable list of all audit log entries.
   *
   * Supported query params:
   * - page: number (default: 1)
   * - limit: number (default: 20)
   * - action: AuditAction enum value
   * - userId: MongoDB ObjectId string
   * - startDate: ISO date string
   * - endDate: ISO date string
   */
  getAuditLogs: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query: AuditLogQuery = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
        action: req.query.action as AuditAction | undefined,
        userId: req.query.userId as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      };

      const result = await adminService.getAuditLogs(query);
      sendSuccess(res, 'Audit logs retrieved', result);
    } catch (error) {
      next(error);
    }
  },
};

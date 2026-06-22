import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../constants/userRoles';
import { sendError } from '../utils/apiResponse.util';

/**
 * Role-based authorization middleware factory.
 *
 * Must be used AFTER the authenticate middleware (requires req.user to be set).
 * Accepts one or more roles — the user must have at least one of them.
 *
 * Usage:
 *   router.get('/admin/stats', authenticate, requireRole(UserRole.ADMIN), adminController.getStats)
 *
 * @param roles - One or more UserRole values that are permitted to access the route
 */
export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required.', [], 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(
        res,
        'You do not have permission to perform this action.',
        [],
        403
      );
      return;
    }

    next();
  };

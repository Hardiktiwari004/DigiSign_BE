import { User } from '../models/User.model';
import { Document } from '../models/Document.model';
import { AuditLog } from '../models/AuditLog.model';
import { IAuditLog } from '../interfaces/IAuditLog';
import { AuditAction } from '../constants/auditActions';
import { DocumentStatus } from '../constants/documentStatus';
import { FilterQuery } from 'mongoose';

/**
 * Dashboard statistics shape returned by getDashboardStats().
 */
export interface DashboardStats {
  users: number;
  documents: number;
  signedDocuments: number;
  auditLogs: number;
}

/**
 * Query params for the admin audit log list.
 */
export interface AuditLogQuery {
  page?: number;
  limit?: number;
  action?: AuditAction;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Paginated audit log result.
 */
export interface PaginatedAuditLogs {
  items: IAuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Admin Service.
 * Provides admin-only data aggregations: dashboard stats and filtered audit log access.
 */
export const adminService = {
  /**
   * Returns platform-wide aggregate statistics for the admin dashboard.
   * All queries run in parallel for performance.
   */
  getDashboardStats: async (): Promise<DashboardStats> => {
    const [users, documents, signedDocuments, auditLogs] = await Promise.all([
      User.countDocuments(),
      // countDocuments on Document model uses the soft-delete filter automatically
      Document.countDocuments(),
      Document.countDocuments({ status: DocumentStatus.SIGNED }),
      AuditLog.countDocuments(),
    ]);

    return { users, documents, signedDocuments, auditLogs };
  },

  /**
   * Returns a paginated, filterable list of audit log entries.
   * Supports filtering by action, userId, and date range.
   * Populates userId with user name and email for display.
   */
  getAuditLogs: async (query: AuditLogQuery): Promise<PaginatedAuditLogs> => {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: FilterQuery<IAuditLog> = {};

    if (query.action) {
      filter.action = query.action;
    }

    if (query.userId) {
      filter.userId = query.userId;
    }

    // Date range filter on createdAt
    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) {
        (filter.createdAt as Record<string, Date>).$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        (filter.createdAt as Record<string, Date>).$lte = new Date(query.endDate);
      }
    }

    const [items, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'name email')
        .populate('documentId', 'title verificationCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return {
      items: items as unknown as IAuditLog[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
};

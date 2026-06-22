import { UserRole } from '../constants/userRoles';

/**
 * Declaration Merging for Express Request Object.
 *
 * This injects the `user` property into the standard Express Request type,
 * allowing TypeScript to recognize `req.user.id` and `req.user.role`
 * in controllers after the authentication middleware has run.
 */
declare global {
  namespace Express {
    interface Request {
      /**
       * The authenticated user's session payload.
       * Populated by the `authenticate` middleware.
       */
      user?: {
        id: string;
        role: UserRole;
      };
    }
  }
}

// Empty export is required to make this file a module
export {};

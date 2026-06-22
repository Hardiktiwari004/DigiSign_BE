import { Request, Response, NextFunction } from 'express';
import { verifyJwtToken } from '../utils/jwt.util';
import { sendError } from '../utils/apiResponse.util';

/**
 * JWT Authentication Middleware.
 *
 * Extracts and verifies the Bearer token from the Authorization header.
 * On success, attaches the decoded payload to req.user.
 * On failure, returns a 401 Unauthorized response.
 *
 * Usage: Apply to any route that requires authentication.
 * router.get('/me', authenticate, authController.getMe)
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Access denied. No token provided.', [], 401);
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      sendError(res, 'Access denied. Malformed token.', [], 401);
      return;
    }

    // verifyJwtToken throws on invalid/expired tokens
    const decoded = verifyJwtToken(token);
    req.user = { id: decoded.id, role: decoded.role };

    next();
  } catch (error) {
    // Forward JWT errors (TokenExpiredError, JsonWebTokenError) to global error handler
    next(error);
  }
};

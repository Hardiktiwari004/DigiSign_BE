import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess } from '../utils/apiResponse.util';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, RefreshTokenDto } from '../validators/auth.validator';

/**
 * Auth Controller — thin layer between HTTP and auth service.
 * Extracts validated request data, delegates to service, returns standard response.
 */
export const authController = {
  /**
   * POST /api/auth/register
   * Registers a new user and returns a JWT token.
   */
  register: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as RegisterDto;
      const ctx = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };

      const result = await authService.register(dto, ctx);

      sendSuccess(res, 'Account created successfully', result, 201);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/login
   * Authenticates a user and returns a JWT token.
   */
  login: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as LoginDto;
      const ctx = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };

      const result = await authService.login(dto, ctx);

      sendSuccess(res, 'Login successful', result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/auth/me
   * Returns the current authenticated user's profile.
   */
  getMe: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const user = await authService.getMe(userId);

      sendSuccess(res, 'User profile retrieved', user);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/forgot-password
   * Initiates password reset flow. Returns reset token (MVP).
   */
  forgotPassword: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as ForgotPasswordDto;
      const ctx = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };

      const result = await authService.forgotPassword(dto, ctx);

      // Always return 200 to avoid revealing whether the email exists
      sendSuccess(
        res,
        'If an account with this email exists, a password reset token has been generated.',
        // Only expose token in non-production (MVP behaviour)
        result
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/reset-password
   * Resets the user's password using a valid reset token.
   */
  resetPassword: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as ResetPasswordDto;
      const ctx = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };

      await authService.resetPassword(dto, ctx);

      sendSuccess(res, 'Password reset successfully. Please login with your new password.');
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/refresh
   * Generates a new access token and refresh token using refresh token rotation.
   */
  refresh: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as RefreshTokenDto;
      const ctx = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };

      const result = await authService.refresh(dto.refreshToken, ctx);

      sendSuccess(res, 'Token refreshed successfully', result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/logout
   * Invalidates the provided refresh token.
   */
  logout: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as RefreshTokenDto;
      const ctx = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };

      await authService.logout(dto.refreshToken, ctx);

      sendSuccess(res, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  },
};

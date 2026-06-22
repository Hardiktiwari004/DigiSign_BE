import { User } from '../models/User.model';
import { IUser } from '../interfaces/IUser';
import { hashPassword, comparePassword } from '../utils/password.util';
import { generateJwtToken } from '../utils/jwt.util';
import { auditService } from './audit.service';
import { AuditAction } from '../constants/auditActions';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from '../validators/auth.validator';
import { v4 as uuidv4 } from 'uuid';

/**
 * Auth context passed from controller to service for audit logging.
 */
interface AuditContext {
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Authentication Service.
 * Contains all business logic for user registration, login, and password management.
 */
export const authService = {
  /**
   * Registers a new user account.
   * - Checks email uniqueness
   * - Hashes password with bcrypt
   * - Creates user record
   * - Returns JWT access token
   */
  register: async (
    dto: RegisterDto,
    ctx: AuditContext
  ): Promise<{ token: string; user: Partial<IUser> }> => {
    // Check for existing email
    const existingUser = await User.findOne({ email: dto.email });
    if (existingUser) {
      const err = new Error('An account with this email already exists') as Error & { statusCode: number };
      err.statusCode = 409;
      throw err;
    }

    // Hash password before storing
    const passwordHash = await hashPassword(dto.password);

    const user = await User.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });

    const token = generateJwtToken({ id: user._id.toString(), role: user.role });

    // Audit log (non-blocking)
    await auditService.log({
      action: AuditAction.USER_REGISTERED,
      userId: user._id.toString(),
      metadata: { email: user.email, name: user.name },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  },

  /**
   * Authenticates a user and returns a JWT access token.
   * - Verifies email exists
   * - Compares password hash
   * - Generates and returns JWT
   */
  login: async (
    dto: LoginDto,
    ctx: AuditContext
  ): Promise<{ token: string; user: Partial<IUser> }> => {
    // passwordHash is excluded by default — must explicitly select it
    const user = await User.findOne({ email: dto.email }).select('+passwordHash');

    if (!user) {
      const err = new Error('Invalid email or password') as Error & { statusCode: number };
      err.statusCode = 401;
      throw err;
    }

    const isPasswordValid = await comparePassword(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      const err = new Error('Invalid email or password') as Error & { statusCode: number };
      err.statusCode = 401;
      throw err;
    }

    const token = generateJwtToken({ id: user._id.toString(), role: user.role });

    await auditService.log({
      action: AuditAction.USER_LOGIN,
      userId: user._id.toString(),
      metadata: { email: user.email },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  },

  /**
   * Returns the authenticated user's profile (no passwordHash).
   */
  getMe: async (userId: string): Promise<Partial<IUser>> => {
    const user = await User.findById(userId);

    if (!user) {
      const err = new Error('User not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },

  /**
   * Initiates the password reset flow.
   * Generates a UUID reset token, stores it with a 1-hour expiry.
   *
   * MVP: returns the token in the response.
   * Production: pass token to notificationService.sendResetEmail(user.email, token) here.
   */
  forgotPassword: async (
    dto: ForgotPasswordDto,
    ctx: AuditContext
  ): Promise<{ resetToken: string }> => {
    const user = await User.findOne({ email: dto.email });

    // Do NOT reveal whether the email exists — always return success
    if (!user) {
      return { resetToken: '' };
    }

    const resetToken = uuidv4();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await User.findByIdAndUpdate(user._id, {
      resetToken,
      resetTokenExpiry,
    });

    await auditService.log({
      action: AuditAction.PASSWORD_RESET_REQUESTED,
      userId: user._id.toString(),
      metadata: { email: user.email },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    // TODO: Replace with email notification service in production
    // await notificationService.sendResetEmail(user.email, resetToken);

    return { resetToken };
  },

  /**
   * Resets the user's password using a valid reset token.
   * - Finds user by token where token has not expired
   * - Hashes the new password
   * - Clears the reset token fields
   */
  resetPassword: async (
    dto: ResetPasswordDto,
    ctx: AuditContext
  ): Promise<void> => {
    const user = await User.findOne({
      resetToken: dto.token,
      resetTokenExpiry: { $gt: new Date() }, // Token must not be expired
    }).select('+resetToken +resetTokenExpiry');

    if (!user) {
      const err = new Error('Invalid or expired password reset token') as Error & { statusCode: number };
      err.statusCode = 400;
      throw err;
    }

    const newPasswordHash = await hashPassword(dto.newPassword);

    await User.findByIdAndUpdate(user._id, {
      passwordHash: newPasswordHash,
      resetToken: null,
      resetTokenExpiry: null,
    });

    await auditService.log({
      action: AuditAction.PASSWORD_RESET_COMPLETED,
      userId: user._id.toString(),
      metadata: { email: user.email },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
  },
};

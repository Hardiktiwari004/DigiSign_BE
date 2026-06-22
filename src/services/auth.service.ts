import { User } from '../models/User.model';
import { IUser } from '../interfaces/IUser';
import { hashPassword, comparePassword } from '../utils/password.util';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.util';
import { RefreshToken } from '../models/RefreshToken.model';
import { env } from '../config/env';
import { auditService } from './audit.service';
import { AuditAction } from '../constants/auditActions';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from '../validators/auth.validator';
import { v4 as uuidv4 } from 'uuid';

/**
 * Parses time strings like '7d', '15m' to milliseconds.
 */
const parseExpiresIn = (val: string): number => {
  const match = val.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const num = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's': return num * 1000;
    case 'm': return num * 60 * 1000;
    case 'h': return num * 60 * 60 * 1000;
    case 'd': return num * 24 * 60 * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
};

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
  ): Promise<{ accessToken: string; refreshToken: string; user: Partial<IUser> }> => {
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

    const accessToken = generateAccessToken({ id: user._id.toString(), role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id.toString(), role: user.role });

    // Store refresh token in database
    const expiresAt = new Date(Date.now() + parseExpiresIn(env.JWT_REFRESH_EXPIRES_IN));
    await RefreshToken.create({
      userId: user._id,
      token: refreshToken,
      expiresAt,
    });

    // Audit log (non-blocking)
    await auditService.log({
      action: AuditAction.USER_REGISTERED,
      userId: user._id.toString(),
      metadata: { email: user.email, name: user.name },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return {
      accessToken,
      refreshToken,
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
  ): Promise<{ accessToken: string; refreshToken: string; user: Partial<IUser> }> => {
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

    const accessToken = generateAccessToken({ id: user._id.toString(), role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id.toString(), role: user.role });

    // Store refresh token in database
    const expiresAt = new Date(Date.now() + parseExpiresIn(env.JWT_REFRESH_EXPIRES_IN));
    await RefreshToken.create({
      userId: user._id,
      token: refreshToken,
      expiresAt,
    });

    await auditService.log({
      action: AuditAction.USER_LOGIN,
      userId: user._id.toString(),
      metadata: { email: user.email },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return {
      accessToken,
      refreshToken,
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

  /**
   * Generates a new pair of access and refresh tokens using refresh token rotation.
   * Invalidates the old refresh token by deleting it from the database.
   */
  refresh: async (
    token: string,
    ctx: AuditContext
  ): Promise<{ accessToken: string; refreshToken: string }> => {
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (error) {
      const err = new Error('Invalid or expired refresh token') as Error & { statusCode: number };
      err.statusCode = 401;
      throw err;
    }

    const dbToken = await RefreshToken.findOne({ token });
    if (!dbToken) {
      const err = new Error('Refresh token has been revoked or already used') as Error & { statusCode: number };
      err.statusCode = 401;
      throw err;
    }

    await RefreshToken.deleteOne({ _id: dbToken._id });

    const userId = dbToken.userId.toString();
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('User not found') as Error & { statusCode: number };
      err.statusCode = 401;
      throw err;
    }

    const newAccessToken = generateAccessToken({ id: userId, role: user.role });
    const newRefreshToken = generateRefreshToken({ id: userId, role: user.role });

    const expiresAt = new Date(Date.now() + parseExpiresIn(env.JWT_REFRESH_EXPIRES_IN));
    await RefreshToken.create({
      userId: user._id,
      token: newRefreshToken,
      expiresAt,
    });

    await auditService.log({
      action: AuditAction.TOKEN_REFRESH,
      userId: userId,
      metadata: { email: user.email },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  },

  /**
   * Invalidates a refresh token by deleting it from the database (logout).
   */
  logout: async (
    token: string,
    ctx: AuditContext
  ): Promise<void> => {
    const dbToken = await RefreshToken.findOne({ token });
    if (!dbToken) {
      return;
    }

    await RefreshToken.deleteOne({ _id: dbToken._id });

    await auditService.log({
      action: AuditAction.USER_LOGOUT,
      userId: dbToken.userId.toString(),
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
  },
};

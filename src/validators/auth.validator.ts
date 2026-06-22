import { z } from 'zod';

/**
 * Common password strength rules.
 * Enforces minimum length, at least one letter, and at least one number.
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(100, 'Password is too long')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// ── Registration Validator ────────────────────────────────────────────────────
export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: passwordSchema,
  role: z.enum(['USER', 'ADMIN']).optional(),
});

export type RegisterDto = z.infer<typeof registerSchema>;

// ── Login Validator ───────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  // We don't enforce complexity rules on login to avoid revealing rules to attackers
  password: z.string().min(1, 'Password is required'),
});

export type LoginDto = z.infer<typeof loginSchema>;

// ── Forgot Password Validator ─────────────────────────────────────────────────
export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
});

export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;

// ── Reset Password Validator ──────────────────────────────────────────────────
export const resetPasswordSchema = z.object({
  token: z.string().uuid('Invalid reset token'),
  newPassword: passwordSchema,
});

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;

// ── Refresh Token Validator ───────────────────────────────────────────────────
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;

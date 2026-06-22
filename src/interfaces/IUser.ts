import { Document } from 'mongoose';
import { UserRole } from '../constants/userRoles';

/**
 * Mongoose document interface for the User model.
 * Extends Mongoose's Document for full type safety with model methods.
 */
export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  /** Temporary token for password reset flow */
  resetToken?: string;
  /** Expiry timestamp for the reset token (1 hour from generation) */
  resetTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

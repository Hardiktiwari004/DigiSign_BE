import { Schema, model } from 'mongoose';
import { IUser } from '../interfaces/IUser';
import { UserRole } from '../constants/userRoles';

/**
 * Mongoose schema for the User collection.
 *
 * Design notes:
 * - Password hashing is performed in the auth service, NOT in a pre-save hook,
 *   to keep business logic centralized and testable.
 * - resetToken and resetTokenExpiry support the forgot-password flow.
 *   Once password is reset, these fields are cleared.
 */
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Never returned in queries unless explicitly selected
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    resetToken: {
      type: String,
      select: false,
    },
    resetTokenExpiry: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    versionKey: false,
  }
);

// Compound index for reset token lookups
userSchema.index({ resetToken: 1, resetTokenExpiry: 1 }, { sparse: true });

export const User = model<IUser>('User', userSchema);

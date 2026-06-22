import { Schema, model } from 'mongoose';
import { IRefreshToken } from '../interfaces/IRefreshToken';

/**
 * Refresh Token Mongoose schema.
 * 
 * Features:
 * -userId: references the User model.
 * -token: unique refresh token string.
 * -expiresAt: date-time when the token is scheduled to expire.
 * -TTL index: automatically deletes the document when expiresAt is reached.
 */
const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

// MongoDB TTL index to automatically purge expired tokens from the collection
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = model<IRefreshToken>('RefreshToken', refreshTokenSchema);

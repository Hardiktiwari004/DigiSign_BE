import { Document, Schema } from 'mongoose';

/**
 * Interface representing the RefreshToken document stored in MongoDB.
 */
export interface IRefreshToken extends Document {
  userId: Schema.Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

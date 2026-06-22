import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from '../constants/userRoles';

/**
 * The expected structure of our JWT payload.
 */
export interface JwtPayload {
  id: string;
  role: UserRole;
}

/**
 * Generates an HS256 Access Token (JWT) for a user.
 *
 * @param payload The user ID and Role
 * @returns A signed JWT string
 */
export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    algorithm: 'HS256', // Explicitly define algorithm to prevent algorithm confusion attacks
  });
};

/**
 * Synchronously verifies and decodes an Access Token (JWT).
 * Throws JsonWebTokenError or TokenExpiredError on failure.
 *
 * @param token The raw JWT string
 * @returns The decoded JwtPayload
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};

/**
 * Generates an HS256 Refresh Token (JWT) for a user.
 *
 * @param payload The user ID and Role
 * @returns A signed JWT string
 */
export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    algorithm: 'HS256',
  });
};

/**
 * Synchronously verifies and decodes a Refresh Token (JWT).
 * Throws JsonWebTokenError or TokenExpiredError on failure.
 *
 * @param token The raw JWT string
 * @returns The decoded JwtPayload
 */
export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
};

// Aliases for backwards compatibility with the existing middleware/services
export const generateJwtToken = generateAccessToken;
export const verifyJwtToken = verifyAccessToken;

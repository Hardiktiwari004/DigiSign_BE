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
 * Generates an HS256 JWT token for a user.
 *
 * @param payload The user ID and Role
 * @returns A signed JWT string
 */
export const generateJwtToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    algorithm: 'HS256', // Explicitly define algorithm to prevent algorithm confusion attacks
  });
};

/**
 * Synchronously verifies and decodes a JWT token.
 * Throws JsonWebTokenError or TokenExpiredError on failure.
 *
 * @param token The raw JWT string
 * @returns The decoded JwtPayload
 */
export const verifyJwtToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};

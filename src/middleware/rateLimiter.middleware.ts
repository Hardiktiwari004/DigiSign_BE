import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/apiResponse.util';
import { Request, Response } from 'express';

/**
 * Custom rate limit exceeded handler.
 * Returns a standard API error envelope instead of the default plain-text response.
 */
const rateLimitHandler = (req: Request, res: Response): void => {
  sendError(
    res,
    'Too many requests. Please try again later.',
    ['Rate limit exceeded for this endpoint'],
    429
  );
};

/**
 * Auth rate limiter — applied to login and forgot-password routes.
 * Prevents brute-force attacks: 10 attempts per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  handler: rateLimitHandler,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
});

/**
 * Verification rate limiter — applied to the public /api/verify/:code route.
 * Prevents automated document verification scraping: 30 requests per 15 minutes per IP.
 */
export const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * General API rate limiter — applied globally to prevent abuse.
 * 100 requests per 10 minutes per IP.
 */
export const generalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

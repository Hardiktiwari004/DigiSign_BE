import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import mongoose from 'mongoose';
import { sendError } from '../utils/apiResponse.util';
import { env } from '../config/env';

/**
 * Global error handling middleware.
 * Must be the LAST middleware registered in app.ts (after all routes).
 *
 * Maps known error types to appropriate HTTP status codes and
 * formats errors into the standard { success: false, message, errors } envelope.
 * In development, stack traces are logged to console.
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  // Log the error in non-production environments
  if (env.NODE_ENV !== 'production') {
    console.error('🔴 Error:', err.message);
    console.error(err.stack);
  } else {
    console.error('🔴 Error:', err.message);
  }

  // ── Zod Validation Errors ──────────────────────────────────────────────────
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    sendError(res, 'Validation failed', errors, 400);
    return;
  }

  // ── JWT Errors ─────────────────────────────────────────────────────────────
  if (err instanceof TokenExpiredError) {
    sendError(res, 'Your session has expired. Please login again.', [], 401);
    return;
  }

  if (err instanceof JsonWebTokenError) {
    sendError(res, 'Invalid authentication token.', [], 401);
    return;
  }

  // ── Mongoose Validation Error ──────────────────────────────────────────────
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => e.message);
    sendError(res, 'Database validation failed', errors, 400);
    return;
  }

  // ── Mongoose Cast Error (invalid ObjectId) ─────────────────────────────────
  if (err instanceof mongoose.Error.CastError) {
    sendError(res, `Invalid value for field: ${err.path}`, [], 400);
    return;
  }

  // ── Mongoose Duplicate Key Error ───────────────────────────────────────────
  if ((err as unknown as Record<string, unknown>).code === 11000) {
    const field = Object.keys((err as unknown as Record<string, unknown>).keyValue ?? {})[0];
    sendError(res, `${field ?? 'Field'} already exists`, [], 409);
    return;
  }

  // ── Application-level HTTP Errors ─────────────────────────────────────────
  // Allows services/controllers to throw { statusCode, message } objects
  const httpError = err as Error & { statusCode?: number };
  if (httpError.statusCode) {
    sendError(res, httpError.message, [], httpError.statusCode);
    return;
  }

  // ── Unhandled / Unknown Errors ─────────────────────────────────────────────
  sendError(
    res,
    env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    [],
    500
  );
};

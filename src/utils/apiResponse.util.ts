import { Response } from 'express';

/**
 * Standardized API response format for the entire application.
 * Ensures that frontend clients always receive a predictable structure.
 */

interface SuccessResponse<T> {
  success: true;
  message: string;
  data?: T;
}

interface ErrorResponse {
  success: false;
  message: string;
  errors: string[];
}

/**
 * Sends a standardized success response.
 *
 * @param res Express Response object
 * @param message Human-readable success message
 * @param data Optional payload
 * @param statusCode HTTP status code (default: 200)
 */
export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200
): void => {
  const response: SuccessResponse<T> = {
    success: true,
    message,
    ...(data !== undefined && { data }),
  };

  res.status(statusCode).json(response);
};

/**
 * Sends a standardized error response.
 * Used internally by the errorHandler middleware and occasionally controllers.
 *
 * @param res Express Response object
 * @param message High-level error summary
 * @param errors Array of specific error details (e.g., validation messages)
 * @param statusCode HTTP status code (default: 500)
 */
export const sendError = (
  res: Response,
  message: string,
  errors: string[] = [],
  statusCode = 500
): void => {
  const response: ErrorResponse = {
    success: false,
    message,
    errors,
  };

  res.status(statusCode).json(response);
};

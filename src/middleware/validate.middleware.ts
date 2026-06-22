import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/apiResponse.util';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Zod validation middleware factory.
 *
 * Creates a middleware that validates a specific part of the Express request
 * against a Zod schema. On success, replaces req[target] with the parsed
 * (and coerced) data. On failure, returns a 400 with formatted field errors.
 *
 * Usage:
 *   router.post('/register', validate(registerSchema, 'body'), authController.register)
 *
 * @param schema - A Zod schema to validate against
 * @param target - Which part of the request to validate ('body' | 'query' | 'params')
 */
export const validate =
  (schema: ZodSchema, target: ValidationTarget = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = (result.error as ZodError).errors.map(
        (e) => `${e.path.join('.') || target}: ${e.message}`
      );
      sendError(res, 'Validation failed', errors, 400);
      return;
    }

    // Replace req[target] with the parsed and coerced data
    // (e.g., string "1" → number 1 for page parameters)
    (req as unknown as Record<string, unknown>)[target] = result.data;
    next();
  };

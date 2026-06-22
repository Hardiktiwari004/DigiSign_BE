import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import apiRoutes from './routes/index';
import { errorHandler } from './middleware/errorHandler.middleware';
import { generalLimiter } from './middleware/rateLimiter.middleware';
import { sendError } from './utils/apiResponse.util';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

const app = express();

// ── Security Headers ──────────────────────────────────────────────────────────
/**
 * Helmet sets a collection of security-related HTTP headers:
 * Content-Security-Policy, X-Frame-Options, X-XSS-Protection, etc.
 */
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
/**
 * Configured CORS — only allows requests from the CLIENT_URL origin.
 * Credentials (cookies/auth headers) are enabled.
 */
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' })); // Allow base64 signature images in JSON body
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ── General Rate Limiting ─────────────────────────────────────────────────────
// Applied globally — per-route limiters (auth, verify) are more restrictive
app.use('/api', generalLimiter);

// ── Health Check ──────────────────────────────────────────────────────────────
/**
 * Health check endpoint for load balancers and monitoring tools.
 * No authentication required.
 */
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ── API Documentation ─────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Optionally serve the raw JSON spec
app.get('/api-docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
// Must come AFTER all valid routes
app.use((req: Request, res: Response) => {
  sendError(res, `Route ${req.method} ${req.originalUrl} not found`, [], 404);
});

// ── Global Error Handler ──────────────────────────────────────────────────────
// Must be the LAST middleware — Express identifies error handlers by 4 parameters
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  errorHandler(err, req, res, next);
});

export default app;

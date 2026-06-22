import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env file before validation
dotenv.config();

/**
 * Zod schema for all required environment variables.
 * The application will refuse to start if any variable is missing or invalid.
 */
const envSchema = z.object({
    PORT: z.string().default('5000'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // Database
    MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

    // JWT
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

    // Cloudinary
    CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
    CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
    CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),

    // CORS
    CLIENT_URL: z.string().url('CLIENT_URL must be a valid URL').default('http://localhost:3000'),
});

// Parse and validate — throw immediately with descriptive error if invalid
const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
    console.error('❌ Invalid environment variables:\n', parsedEnv.error.format());
    process.exit(1);
}

export const env = parsedEnv.data;
export type Env = z.infer<typeof envSchema>;

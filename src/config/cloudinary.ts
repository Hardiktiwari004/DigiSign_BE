import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

/**
 * Initializes the Cloudinary SDK v2 with credentials from environment variables.
 * Called once at application startup.
 */
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true, // Always use HTTPS
});

export { cloudinary };

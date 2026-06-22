import mongoose from 'mongoose';
import { env } from './env';

/**
 * Establishes a connection to MongoDB Atlas using Mongoose.
 * Includes connection event listeners for observability.
 */
export const connectDB = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', false);

    const conn = await mongoose.connect(env.MONGO_URI, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    // Connection event listeners
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

/**
 * Gracefully closes the MongoDB connection.
 * Called on SIGTERM / SIGINT for clean shutdown.
 */
export const disconnectDB = async (): Promise<void> => {
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed gracefully');
};

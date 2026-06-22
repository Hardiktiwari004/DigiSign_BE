import app from './app';
import { env } from './config/env';
import { connectDB, disconnectDB } from './config/db';

const PORT = parseInt(env.PORT, 10);

/**
 * Application entry point.
 * 1. Connects to MongoDB Atlas
 * 2. Starts the HTTP server
 * 3. Registers graceful shutdown handlers
 */
const startServer = async (): Promise<void> => {
  // Step 1: Connect to the database before accepting requests
  await connectDB();

  // Step 2: Start the HTTP server
  const server = app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════╗
║   Digital Signature Platform API                     ║
╠══════════════════════════════════════════════════════╣
║   Status:       Running                              ║
║   Port:         ${PORT.toString().padEnd(36)}║
║   Environment:  ${env.NODE_ENV.padEnd(36)}║
║   Health:       http://localhost:${PORT}/health        ║
║   Docs:         http://localhost:${PORT}/api-docs      ║
╚══════════════════════════════════════════════════════╝
    `);
  });

  // Step 3: Graceful shutdown handlers
  /**
   * SIGTERM: Sent by process managers (PM2, Kubernetes, Docker) to request graceful shutdown.
   * SIGINT: Sent by Ctrl+C in development.
   */
  const gracefulShutdown = async (signal: string): Promise<void> => {
    console.log(`\n📥 Received ${signal}. Initiating graceful shutdown...`);

    server.close(async () => {
      console.log('🔌 HTTP server closed — no longer accepting new connections');

      await disconnectDB();

      console.log('✅ Graceful shutdown complete');
      process.exit(0);
    });

    // Force exit if graceful shutdown takes too long (10 seconds)
    setTimeout(() => {
      console.error('❌ Graceful shutdown timed out. Forcing exit.');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Unhandled promise rejections — log and exit to avoid undefined state
  process.on('unhandledRejection', (reason: unknown) => {
    console.error('❌ Unhandled Rejection:', reason);
    server.close(() => process.exit(1));
  });

  // Uncaught exceptions — always fatal in Node.js
  process.on('uncaughtException', (error: Error) => {
    console.error('❌ Uncaught Exception:', error);
    server.close(() => process.exit(1));
  });
};

startServer();

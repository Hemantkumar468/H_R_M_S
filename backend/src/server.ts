import { createApp } from './app';
import { env } from './config/env.config';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './config/logger';

const startServer = async () => {
  try {
    // 1. Initialize Express App
    const app = createApp();

    // 2. Listen on Port
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 HRMS Backend Server running on port ${env.PORT} in [${env.NODE_ENV}] mode`);
      logger.info(`📡 API Health Endpoint: http://localhost:${env.PORT}${env.API_PREFIX}/health`);
    });

    // 3. Connect to Database with graceful background retry
    const tryConnectDb = async () => {
      try {
        logger.info(`Connecting to MongoDB at: ${env.MONGO_URI}...`);
        await connectDatabase();
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logger.warn(
          `⚠️ MongoDB connection failed (${errorMsg}). Retrying in 5 seconds... Make sure MongoDB is running or configure MONGO_URI in apps/backend/.env`,
        );
        setTimeout(tryConnectDb, 5000);
      }
    };

    tryConnectDb();

    // Graceful Shutdown
    const handleShutdown = async (signal: string) => {
      logger.info(`⚠️ Received ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        await disconnectDatabase();
        logger.info('Graceful shutdown completed.');
        process.exit(0);
      });

      // Force shutdown after timeout
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));

    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('💥 Unhandled Rejection:', reason);
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('💥 Uncaught Exception:', error);
      process.exit(1);
    });
  } catch (error) {
    logger.error('❌ Server failed to start:', error);
    process.exit(1);
  }
};

startServer();

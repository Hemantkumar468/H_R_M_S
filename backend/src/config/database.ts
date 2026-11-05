import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env.config';
import { logger } from './logger';

// Configure DNS resolution for MongoDB Atlas SRV connection strings to prevent querySrv ETIMEOUT on Windows
if (env.MONGO_URI.startsWith('mongodb+srv://')) {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  } catch (dnsErr) {
    logger.warn('Could not set custom DNS servers, using system default', dnsErr);
  }
}

export const connectDatabase = async (): Promise<typeof mongoose> => {
  try {
    mongoose.set('strictQuery', true);

    mongoose.connection.on('connected', () => {
      logger.info(' MongoDB connection established successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(' MongoDB connection error:', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected. Attempting reconnection...');
    });

    const conn = await mongoose.connect(env.MONGO_URI, {
      autoIndex: env.NODE_ENV !== 'production',
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    return conn;
  } catch (error) {
    logger.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    logger.info(' MongoDB connection closed gracefully');
  } catch (error) {
    logger.error('❌ Error closing MongoDB connection:', error);
    throw error;
  }
};

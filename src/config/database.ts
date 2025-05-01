import mongoose from 'mongoose';
import config from './config';
import logger from '../utils/logger';

/**
 * Connect to MongoDB database
 */
const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.mongoose.url);
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle MongoDB connection events
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
      process.exit(1);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error connecting to MongoDB: ${error.message}`);
    } else {
      logger.error('Unknown error connecting to MongoDB');
    }
    process.exit(1);
  }
};

export default connectDB;
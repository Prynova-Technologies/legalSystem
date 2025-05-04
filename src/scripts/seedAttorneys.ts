import mongoose from 'mongoose';
import config from '../config/config';
import User from '../models/user.model';
import { UserRole } from '../interfaces/user.interface';
import logger from '../utils/logger';

/**
 * Seed script to create attorney users in the database
 */
async function seedAttorneys() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoose.url, config.mongoose.options as mongoose.ConnectOptions);
    logger.info('Connected to MongoDB');

    // Define attorney data
    const attorneys = [
      {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@lawfirm.com',
        password: 'Password123!',
        role: UserRole.LAWYER,
        isActive: true
      },
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@lawfirm.com',
        password: 'Password123!',
        role: UserRole.LAWYER,
        isActive: true
      }
    ];

    // Check if attorneys already exist
    for (const attorney of attorneys) {
      const existingUser = await User.findOne({ email: attorney.email });
      
      if (existingUser) {
        logger.info(`Attorney ${attorney.firstName} ${attorney.lastName} already exists`);
      } else {
        // Create new attorney
        await User.create(attorney);
        logger.info(`Created attorney: ${attorney.firstName} ${attorney.lastName}`);
      }
    }

    logger.info('Attorney seeding completed successfully');
  } catch (error) {
    logger.error('Error seeding attorneys:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// Run the seed function
seedAttorneys();
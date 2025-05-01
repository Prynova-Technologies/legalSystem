import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserService } from '../src/services/user.service';
import { UserRole } from '../src/interfaces/user.interface';
import logger from '../src/utils/logger';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/law-management')
  .then(() => {
    console.log('Connected to MongoDB');
    createSuperAdmin();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function createSuperAdmin() {
  try {
    // Define admin credentials - you can customize these
    const adminData = {
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@lawfirm.com',
      password: 'Admin@123', // You should change this to a secure password
      role: UserRole.ADMIN,
      isActive: true
    };

    // Check if admin already exists
    const existingAdmin = await UserService.getUserByEmail(adminData.email);
    
    if (existingAdmin) {
      console.log('Super admin already exists with email:', adminData.email);
      console.log('Admin credentials:');
      console.log('Email:', adminData.email);
      console.log('Password: [Use the password you set when creating the admin]');
    } else {
      // Create super admin user
      const admin = await UserService.createUser(adminData);
      
      console.log('Super admin created successfully!');
      console.log('Admin credentials:');
      console.log('Email:', adminData.email);
      console.log('Password:', adminData.password);
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error creating super admin:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}
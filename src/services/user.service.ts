import User from '../models/user.model';
import { IUserDocument, UserRole } from '../interfaces/user.interface';
import logger from '../utils/logger';

/**
 * Service for user-related operations
 */
export class UserService {
  /**
   * Get all users
   */
  static async getAllUsers(): Promise<IUserDocument[]> {
    try {
      return await User.find().select('-password -resetPasswordToken -resetPasswordExpire');
    } catch (error) {
      logger.error('Error fetching all users', { error });
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<IUserDocument | null> {
    try {
      return await User.findById(userId).select('-password -resetPasswordToken -resetPasswordExpire');
    } catch (error) {
      logger.error('Error fetching user by ID', { error, userId });
      throw error;
    }
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<IUserDocument | null> {
    try {
      // Explicitly include password field for authentication purposes
      return await User.findOne({ email });
    } catch (error) {
      logger.error('Error fetching user by email', { error, email });
      throw error;
    }
  }

  /**
   * Create a new user
   */
  static async createUser(userData: Partial<IUserDocument>): Promise<IUserDocument> {
    try {
      const user = await User.create(userData);
      logger.info('New user created', { userId: user._id });
      return user;
    } catch (error) {
      logger.error('Error creating user', { error, userData });
      throw error;
    }
  }

  /**
   * Update a user
   */
  static async updateUser(userId: string, updateData: Partial<IUserDocument>): Promise<IUserDocument | null> {
    try {
      const user = await User.findById(userId);
      if (!user) return null;

      // Update user fields
      Object.keys(updateData).forEach((key) => {
        if (updateData[key as keyof IUserDocument] !== undefined) {
          (user as any)[key] = updateData[key as keyof IUserDocument];
        }
      });

      await user.save();
      logger.info('User updated', { userId });
      return user;
    } catch (error) {
      logger.error('Error updating user', { error, userId, updateData });
      throw error;
    }
  }

  /**
   * Delete a user
   */
  static async deleteUser(userId: string): Promise<boolean> {
    try {
      const result = await User.findByIdAndDelete(userId);
      if (result) {
        logger.info('User deleted', { userId });
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error deleting user', { error, userId });
      throw error;
    }
  }

  /**
   * Get users by role
   */
  static async getUsersByRole(role: UserRole): Promise<IUserDocument[]> {
    try {
      return await User.find({ role, isActive: true })
        .select('_id firstName lastName email')
        .sort({ lastName: 1, firstName: 1 });
    } catch (error) {
      logger.error('Error fetching users by role', { error, role });
      throw error;
    }
  }

  /**
   * Change user password
   */
  static async changePassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      const user = await User.findById(userId).select('+password');
      if (!user) return false;

      user.password = newPassword;
      await user.save();
      
      logger.info('User password changed', { userId });
      return true;
    } catch (error) {
      logger.error('Error changing user password', { error, userId });
      throw error;
    }
  }

  /**
   * Verify current password
   */
  static async verifyPassword(userId: string, password: string): Promise<boolean> {
    try {
      const user = await User.findById(userId).select('+password');
      if (!user) return false;

      return await user.comparePassword(password);
    } catch (error) {
      logger.error('Error verifying user password', { error, userId });
      throw error;
    }
  }
}
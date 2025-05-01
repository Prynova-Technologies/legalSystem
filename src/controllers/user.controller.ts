import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { ApiError } from '../middlewares/error';
import { IUserDocument, UserRole } from '../interfaces/user.interface';
import { DeviceTrackingService } from '../services/deviceTracking.service';
import { SocketService } from '../services/socket.service';
import { UserService } from '../services/user.service';

/**
 * Controller for user management
 */
export const userController = {
  /**
   * Get all users
   */
  getAllUsers: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user has admin role
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Admin access required');
      }

      const users = await UserService.getAllUsers();
      
      res.status(httpStatus.OK).json({
        success: true,
        data: users
      });
    } catch (error) {
      res.status(error instanceof ApiError ? error.statusCode : httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  },

  /**
   * Get user by ID
   */
  getUserById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user has admin role
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Admin access required');
      }

      const userId = req.params.id;
      
      if (!userId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'User ID is required');
      }

      const user = await UserService.getUserById(userId);
      
      if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
      }

      res.status(httpStatus.OK).json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(error instanceof ApiError ? error.statusCode : httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  },

  /**
   * Create a new user
   */
  createUser: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user has admin role
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Admin access required');
      }

      const { firstName, lastName, email, password, role, isActive } = req.body;

      // Check if email already exists
      const existingUser = await UserService.getUserByEmail(email);
      if (existingUser) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Email already in use');
      }

      // Create new user
      const user = await UserService.createUser({
        firstName,
        lastName,
        email,
        password,
        role,
        isActive: isActive !== undefined ? isActive : true
      });

      // Don't return password in response
      const userResponse = user.toObject();
      delete userResponse.password;
      delete userResponse.resetPasswordToken;
      delete userResponse.resetPasswordExpire;

      res.status(httpStatus.CREATED).json({
        success: true,
        data: userResponse,
        message: 'User created successfully'
      });
    } catch (error) {
      res.status(error instanceof ApiError ? error.statusCode : httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  },

  /**
   * Update a user
   */
  updateUser: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user has admin role
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Admin access required');
      }

      const userId = req.params.id;
      
      if (!userId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'User ID is required');
      }

      const { firstName, lastName, email, role, isActive } = req.body;

      // Check if user exists
      const user = await UserService.getUserById(userId);
      if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
      }

      // Check if email is being changed and if it's already in use
      if (email && email !== user.email) {
        const existingUser = await UserService.getUserByEmail(email);
        if (existingUser && existingUser._id.toString() !== userId) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Email already in use');
        }
      }

      // Update user
      const updatedUser = await UserService.updateUser(userId, {
        firstName,
        lastName,
        email,
        role,
        isActive
      });
      
      if (!updatedUser) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
      }

      // Don't return password in response
      const userResponse = updatedUser.toObject();
      delete userResponse.password;
      delete userResponse.resetPasswordToken;
      delete userResponse.resetPasswordExpire;

      res.status(httpStatus.OK).json({
        success: true,
        data: userResponse,
        message: 'User updated successfully'
      });
    } catch (error) {
      res.status(error instanceof ApiError ? error.statusCode : httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  },

  /**
   * Delete a user
   */
  deleteUser: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user has admin role
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Admin access required');
      }

      const userId = req.params.id;
      
      if (!userId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'User ID is required');
      }

      // Check if user exists
      const user = await UserService.getUserById(userId);
      if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
      }

      // End all active sessions for this user
      await DeviceTrackingService.endSession(userId);

      // Delete the user
      const deleted = await UserService.deleteUser(userId);
      if (!deleted) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to delete user');
      }

      res.status(httpStatus.OK).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      res.status(error instanceof ApiError ? error.statusCode : httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  },

  /**
   * Update own profile
   */
  updateProfile: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
      }

      const userId = req.user._id;
      const { firstName, lastName, email } = req.body;

      // Check if user exists
      const user = await UserService.getUserById(userId);
      if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
      }

      // Check if email is being changed and if it's already in use
      if (email && email !== user.email) {
        const existingUser = await UserService.getUserByEmail(email);
        if (existingUser && existingUser._id.toString() !== userId) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Email already in use');
        }
      }

      // Update user
      const updatedUser = await UserService.updateUser(userId, {
        firstName,
        lastName,
        email
      });
      
      if (!updatedUser) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
      }

      // Don't return password in response
      const userResponse = updatedUser.toObject();
      delete userResponse.password;
      delete userResponse.resetPasswordToken;
      delete userResponse.resetPasswordExpire;

      res.status(httpStatus.OK).json({
        success: true,
        data: userResponse,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      res.status(error instanceof ApiError ? error.statusCode : httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  },

  /**
   * Change password
   */
  changePassword: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
      }

      const userId = req.user._id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Current password and new password are required');
      }

      // Check if new password meets requirements
      if (newPassword.length < 8) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Password must be at least 8 characters long');
      }

      // Check if user exists
      const user = await UserService.getUserById(userId);
      if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
      }

      // Check if current password is correct
      const isMatch = await UserService.verifyPassword(userId, currentPassword);
      if (!isMatch) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Current password is incorrect');
      }

      // Update password
      const passwordChanged = await UserService.changePassword(userId, newPassword);
      if (!passwordChanged) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to change password');
      }

      // End all other sessions for security
      if (req.deviceInfo?.deviceId) {
        const activeSessions = await DeviceTrackingService.getActiveSessions(userId);
        const endPromises = activeSessions
          .filter(session => session.deviceInfo.deviceId !== req.deviceInfo?.deviceId)
          .map(session => DeviceTrackingService.endSession(userId, session.deviceInfo.deviceId));
        
        await Promise.all(endPromises);
        
        // Notify through socket about password change and sessions being ended
        SocketService.emitToUser(userId, 'password-changed', { 
          message: 'Your password has been changed. All other sessions have been ended for security.',
          timestamp: new Date()
        });
      }

      res.status(httpStatus.OK).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      res.status(error instanceof ApiError ? error.statusCode : httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  }
};
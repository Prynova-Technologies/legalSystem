import { Request, Response, NextFunction } from 'express';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import httpStatus from 'http-status';
import crypto from 'crypto';
import { ApiError } from '../middlewares/error';
import { UserService } from '../services/user.service';
import { DeviceTrackingService } from '../services/deviceTracking.service';
import { SocketService } from '../services/socket.service';
import config from '../config/config';
import { IUserDocument } from '../interfaces/user.interface';
import User from '../models/user.model';

/**
 * Generate JWT token for authenticated user
 */
const generateToken = (user: IUserDocument): string => {
  const payload = { 
    id: user._id,
    role: user.role 
  };
  const secret: Secret = config.jwt.secret;
  const options = { expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'] };
  
  return jwt.sign(payload, secret, options);
};

/**
 * Controller for authentication
 */
export const authController = {
  /**
   * Register a new user
   */
  register: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { firstName, lastName, email, password, role } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email || !password) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Please provide all required fields');
      }

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
        isActive: true
      });

      // Generate token
      const token = generateToken(user);

      // Don't return password in response
      const userResponse = user.toObject();
      delete userResponse.password;
      delete userResponse.resetPasswordToken;
      delete userResponse.resetPasswordExpire;

      // Track device session if device info is available
      if (req.deviceInfo) {
        await DeviceTrackingService.trackSession(user._id, req.deviceInfo);
      }

      res.status(httpStatus.CREATED).json({
        success: true,
        token,
        data: userResponse,
        message: 'User registered successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Login user
   */
  login: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Validate email and password
      if (!email || !password) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Please provide email and password');
      }

      // Check if user exists
      const user = await UserService.getUserByEmail(email);
      if (!user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Your account has been deactivated');
      }

      // Check if password is correct
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid credentials');
      }

      // Generate token
      const token = generateToken(user);

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Don't return password in response
      const userResponse = user.toObject();
      delete userResponse.password;
      delete userResponse.resetPasswordToken;
      delete userResponse.resetPasswordExpire;

      // Track device session if device info is available
      if (req.deviceInfo) {
        await DeviceTrackingService.trackSession(user._id, req.deviceInfo);
      }

      res.status(httpStatus.OK).json({
        success: true,
        token,
        data: userResponse,
        message: 'Logged in successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Logout user
   */
  logout: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
      }

      // End the device session when user logs out
      if (req.deviceInfo?.deviceId) {
        await DeviceTrackingService.endSession(req.user._id, req.deviceInfo.deviceId);
      }

      res.status(httpStatus.OK).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get current user profile
   */
  getMe: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
      }

      const user = await UserService.getUserById(req.user._id);
      if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
      }

      res.status(httpStatus.OK).json({
        success: true,
        data: user,
        message: 'User profile retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Forgot password
   */
  forgotPassword: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Please provide an email address');
      }

      // Find user by email
      const user = await UserService.getUserByEmail(email);
      if (!user) {
        // For security reasons, don't reveal that the user doesn't exist
        res.status(httpStatus.OK).json({
          success: true,
          message: 'If your email is registered, you will receive a password reset link'
        });
        return;
      }

      // Generate reset token
      const resetToken = user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });

      // Create reset URL
      const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;

      // In a real application, you would send an email with the reset URL
      // For now, just log it and return it in the response (for development purposes)
      console.log(`Reset URL: ${resetUrl}`);

      res.status(httpStatus.OK).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link',
        resetUrl // Remove this in production
      });
    } catch (error) {
      // If there's an error, reset the token fields
      if (req.body.email) {
        const user = await UserService.getUserByEmail(req.body.email);
        if (user) {
          user.resetPasswordToken = undefined;
          user.resetPasswordExpire = undefined;
          await user.save({ validateBeforeSave: false });
        }
      }

      next(error);
    }
  },

  /**
   * Reset password
   */
  resetPassword: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { password } = req.body;
      const { token } = req.params;

      if (!password) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Please provide a new password');
      }

      if (!token) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Reset token is required');
      }

      // Hash the token from the URL
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Find user with the token and check if token is still valid
      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() }
      });

      if (!user) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired token');
      }

      // Set new password
      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      // End all active sessions for security
      await DeviceTrackingService.endSession(user._id);

      // Notify through socket about password change
      SocketService.emitToUser(user._id, 'password-reset', { 
        message: 'Your password has been reset. All sessions have been ended for security.',
        timestamp: new Date()
      });

      res.status(httpStatus.OK).json({
        success: true,
        message: 'Password reset successful'
      });
    } catch (error) {
      next(error);
    }
  }
};
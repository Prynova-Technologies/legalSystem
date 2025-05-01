import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import config from '../config/config';
import { ApiError } from './error';
import { IUserDocument, UserRole } from '../interfaces/user.interface';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument;
    }
  }
}

/**
 * Authentication middleware to protect routes
 * Verifies JWT token and attaches user to request object
 */
import DeviceSession from '../models/deviceSession.model';
import logger from '../utils/logger';

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid authentication token');
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret) as { id: string; role: string };
      
      // Attach user to request
      req.user = {
        _id: decoded.id,
        role: decoded.role
      } as IUserDocument;
      
      // Track device session if device info is available
      if (req.deviceInfo) {
        try {
          // Find or create a device session
          const existingSession = await DeviceSession.findOne({
            userId: req.user._id,
            'deviceInfo.deviceId': req.deviceInfo.deviceId || 'unknown',
            'deviceInfo.ip': req.deviceInfo.ip,
            isActive: true
          });
          
          if (existingSession) {
            // Update existing session
            existingSession.lastActive = new Date();
            await existingSession.save();
          } else {
            // Create new session
            await DeviceSession.create({
              userId: req.user._id,
              deviceInfo: req.deviceInfo,
              loginTime: new Date(),
              isActive: true
            });
            
            // Log new device login
            logger.info('New device login', {
              userId: req.user._id,
              deviceInfo: req.deviceInfo
            });
          }
        } catch (sessionError) {
          // Log error but don't block authentication
          logger.error('Error tracking device session', { error: sessionError });
        }
      }
      
      next();
    } catch (error) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired token');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based authorization middleware
 * @param {...(string | UserRole)[]} roles - Allowed roles
 */
export const authorize = (roles: (string | UserRole)[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required'));
      return;
    }
    
    if (!roles.includes(req.user.role)) {
      next(new ApiError(httpStatus.FORBIDDEN, 'Access denied: Insufficient permissions'));
      return;
    }
    
    next();
  };
};
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Interface for device information
 */
export interface IDeviceInfo {
  userAgent: string;
  ip: string;
  deviceId?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  timestamp: Date;
}

/**
 * Extend Express Request interface to include device info
 */
declare global {
  namespace Express {
    interface Request {
      deviceInfo?: IDeviceInfo;
    }
  }
}

/**
 * Extract device information from request
 */
const extractDeviceInfo = (req: Request): IDeviceInfo => {
  const userAgent = req.headers['user-agent'] || 'Unknown';
  
  // Get IP address (considering potential proxies)
  const ip = 
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    'Unknown';
  
  // Extract device ID if provided in headers
  const deviceId = req.headers['x-device-id'] as string;
  
  // Basic device type detection
  let deviceType = 'Unknown';
  let browser = 'Unknown';
  let os = 'Unknown';
  
  if (userAgent) {
    // Simple OS detection
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'MacOS';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('Linux')) os = 'Linux';
    
    // Simple browser detection
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Edg')) browser = 'Edge';
    
    // Simple device type detection
    if (userAgent.includes('Mobile')) deviceType = 'Mobile';
    else if (userAgent.includes('Tablet')) deviceType = 'Tablet';
    else deviceType = 'Desktop';
  }
  
  return {
    userAgent,
    ip,
    deviceId,
    deviceType,
    browser,
    os,
    timestamp: new Date()
  };
};

/**
 * Middleware to track device information
 */
export const deviceTracker = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Extract device information
    const deviceInfo = extractDeviceInfo(req);
    
    // Attach to request object for use in other middlewares/controllers
    req.deviceInfo = deviceInfo;
    
    // Log device information
    logger.info('Device connected', { 
      deviceInfo,
      path: req.path,
      method: req.method,
      userId: req.user?._id
    });
    
    next();
  } catch (error) {
    // Log error but don't block the request
    logger.error('Error tracking device', { error });
    next();
  }
};
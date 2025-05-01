import mongoose from 'mongoose';
import DeviceSession from '../models/deviceSession.model';
import { IDeviceInfo } from '../middlewares/deviceTracker';
import logger from '../utils/logger';
import { SocketService } from './socket.service';

/**
 * Service for managing device tracking and sessions
 */
export class DeviceTrackingService {
  /**
   * Create or update a device session
   */
  static async trackSession(userId: string, deviceInfo: IDeviceInfo): Promise<void> {
    try {
      // Find existing active session for this device
      const existingSession = await DeviceSession.findOne({
        userId: userId,
        'deviceInfo.deviceId': deviceInfo.deviceId || 'unknown',
        'deviceInfo.ip': deviceInfo.ip,
        isActive: true
      });
      
      if (existingSession) {
        // Update existing session
        existingSession.lastActive = new Date();
        existingSession.deviceInfo = deviceInfo;
        await existingSession.save();
      } else {
        // Create new session
        await DeviceSession.create({
          userId: userId,
          deviceInfo,
          loginTime: new Date(),
          isActive: true
        });
        
        // Log new device login
        logger.info('New device login', {
          userId,
          deviceInfo
        });
        
        // Emit socket event for new device login
        SocketService.notifyNewDeviceLogin(userId, deviceInfo);
      }
    } catch (error) {
      logger.error('Error tracking device session', { error });
      throw error;
    }
  }
  
  /**
   * Mark a device session as inactive (logged out)
   */
  static async endSession(userId: string, deviceId?: string): Promise<void> {
    try {
      const query: any = {
        userId: userId,
        isActive: true
      };
      
      // If deviceId is provided, only end that specific session
      if (deviceId) {
        query['deviceInfo.deviceId'] = deviceId;
      }
      
      await DeviceSession.updateMany(
        query,
        {
          $set: {
            isActive: false,
            logoutTime: new Date()
          }
        }
      );
      
      logger.info('Device session ended', { userId, deviceId });
      
      // Emit socket event for session ended
      SocketService.emitToUser(userId, 'session-ended', { deviceId });
    } catch (error) {
      logger.error('Error ending device session', { error });
      throw error;
    }
  }
  
  /**
   * Get active sessions for a user
   */
  static async getActiveSessions(userId: string): Promise<any[]> {
    try {
      return await DeviceSession.find({
        userId: userId,
        isActive: true
      }).sort({ lastActive: -1 });
    } catch (error) {
      logger.error('Error fetching active sessions', { error });
      throw error;
    }
  }
  
  /**
   * Get suspicious login attempts (multiple devices, unusual locations)
   */
  static async getSuspiciousLogins(days = 7): Promise<any[]> {
    return await this.detectAndNotifySuspiciousLogins(days);
  }
  
  /**
   * Detect suspicious logins and notify users in real-time
   */
  static async detectAndNotifySuspiciousLogins(days = 7): Promise<any[]> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    
    try {
      // Find users with multiple active sessions from different IPs
      const sessions = await DeviceSession.aggregate([
        {
          $match: {
            createdAt: { $gte: dateThreshold }
          }
        },
        {
          $group: {
            _id: { userId: '$userId', ip: '$deviceInfo.ip' },
            count: { $sum: 1 },
            sessions: { $push: '$$ROOT' }
          }
        },
        {
          $group: {
            _id: '$_id.userId',
            uniqueIPs: { $sum: 1 },
            ipDetails: { $push: { ip: '$_id.ip', count: '$count', sessions: '$sessions' } }
          }
        },
        {
          $match: {
            uniqueIPs: { $gt: 3 } // Threshold for suspicious activity
          }
        }
      ]);
      
      return sessions;
    } catch (error) {
      logger.error('Error detecting suspicious logins', { error });
      throw error;
    }
  }
}
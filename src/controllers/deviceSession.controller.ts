import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { DeviceTrackingService } from '../services/deviceTracking.service';
import { ApiError } from '../middlewares/error';
import { SocketService } from '../services/socket.service';

/**
 * Controller for device session management
 */
export const deviceSessionController = {
  /**
   * Get all active sessions for the current user
   */
  getActiveSessions: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
      }

      const sessions = await DeviceTrackingService.getActiveSessions(req.user._id);
      res.status(httpStatus.OK).json({
        success: true,
        data: sessions
      });
    } catch (error) {
      res.status(error instanceof ApiError ? error.statusCode : httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  },

  /**
   * End a specific device session
   */
  endSession: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
      }

      const { sessionId, deviceId } = req.body;
      
      if (!deviceId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Device ID is required');
      }

      await DeviceTrackingService.endSession(req.user._id, deviceId);
      
      // Notify through socket about session end
      SocketService.emitToUser(req.user._id, 'session-ended', { deviceId });
      
      res.status(httpStatus.OK).json({
        success: true,
        message: 'Device session ended successfully'
      });
    } catch (error) {
      res.status(error instanceof ApiError ? error.statusCode : httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  },

  /**
   * End all active sessions except the current one
   */
  endAllOtherSessions: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
      }

      // Get current device ID
      const currentDeviceId = req.deviceInfo?.deviceId;
      
      // Get all active sessions
      const activeSessions = await DeviceTrackingService.getActiveSessions(req.user._id);
      
      // End all sessions except the current one
      const endPromises = activeSessions
        .filter(session => session.deviceInfo.deviceId !== currentDeviceId)
        .map(session => DeviceTrackingService.endSession(req.user!._id, session.deviceInfo.deviceId));
      
      await Promise.all(endPromises);
      
      // Notify through socket about all other sessions being ended
      SocketService.emitToUser(req.user._id, 'sessions-ended', { 
        message: 'All other device sessions have been ended',
        timestamp: new Date()
      });
      
      res.status(httpStatus.OK).json({
        success: true,
        message: 'All other device sessions ended successfully'
      });
    } catch (error) {
      res.status(error instanceof ApiError ? error.statusCode : httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  },

  /**
   * For admins: Get suspicious login activities
   */
  getSuspiciousLogins: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        throw new ApiError(httpStatus.FORBIDDEN, 'Admin access required');
      }

      const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;
      const suspiciousLogins = await DeviceTrackingService.getSuspiciousLogins(days);
      
      // Notify affected users through socket
      suspiciousLogins.forEach(login => {
        SocketService.notifySuspiciousActivity(login._id, {
          uniqueIPs: login.uniqueIPs,
          details: login.ipDetails,
          timestamp: new Date()
        });
      });
      
      res.status(httpStatus.OK).json({
        success: true,
        data: suspiciousLogins
      });
    } catch (error) {
      res.status(error instanceof ApiError ? error.statusCode : httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  }
};
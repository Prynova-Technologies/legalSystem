import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import logger from '../utils/logger';
import { DeviceTrackingService } from './deviceTracking.service';
import { IDeviceInfo } from '../middlewares/deviceTracker';

/**
 * Socket.IO service for real-time communications
 */
export class SocketService {
  private static io: SocketIOServer;
  private static userSockets: Map<string, Set<string>> = new Map();

  /**
   * Initialize Socket.IO server
   */
  static initialize(server: HttpServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: '*', // In production, restrict this to your frontend domain
        methods: ['GET', 'POST']
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    logger.info('Socket.IO server initialized');
  }

  /**
   * Setup Socket.IO middleware for authentication
   */
  private static setupMiddleware(): void {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      // Verify JWT token here (similar to your auth middleware)
      try {
        // For demonstration, we're just extracting userId from the socket handshake
        // In a real implementation, you would verify the JWT token
        const userId = socket.handshake.auth.userId;
        if (!userId) {
          return next(new Error('User ID not provided'));
        }

        // Attach user ID to socket for later use
        socket.data.userId = userId;
        
        // Track this socket connection for the user
        if (!this.userSockets.has(userId)) {
          this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId)?.add(socket.id);
        
        next();
      } catch (error) {
        logger.error('Socket authentication error', { error });
        next(new Error('Authentication error'));
      }
    });
  }

  /**
   * Setup Socket.IO event handlers
   */
  private static setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      const userId = socket.data.userId;
      logger.info('New socket connection', { userId, socketId: socket.id });

      // Track device info for this connection
      const deviceInfo: IDeviceInfo = {
        userAgent: socket.handshake.headers['user-agent'] as string || 'Unknown',
        ip: socket.handshake.address,
        deviceId: socket.handshake.auth.deviceId,
        timestamp: new Date()
      };

      // Track this session
      DeviceTrackingService.trackSession(userId, deviceInfo)
        .catch(err => logger.error('Error tracking socket session', { error: err }));

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info('Socket disconnected', { userId, socketId: socket.id });
        
        // Remove this socket from user's active sockets
        this.userSockets.get(userId)?.delete(socket.id);
        if (this.userSockets.get(userId)?.size === 0) {
          this.userSockets.delete(userId);
        }
      });

      // Handle custom events
      socket.on('get-active-sessions', async () => {
        try {
          const sessions = await DeviceTrackingService.getActiveSessions(userId);
          socket.emit('active-sessions', sessions);
        } catch (error) {
          logger.error('Error fetching active sessions', { error });
          socket.emit('error', { message: 'Failed to fetch active sessions' });
        }
      });
    });
  }

  /**
   * Emit event to a specific user across all their connected devices
   */
  static emitToUser(userId: string, event: string, data: any): void {
    const userSocketIds = this.userSockets.get(userId);
    if (userSocketIds && userSocketIds.size > 0) {
      userSocketIds.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
      logger.debug(`Emitted ${event} to user ${userId}`, { socketCount: userSocketIds.size });
    }
  }

  /**
   * Emit event to all connected clients
   */
  static emitToAll(event: string, data: any): void {
    this.io.emit(event, data);
    logger.debug(`Emitted ${event} to all users`);
  }

  /**
   * Notify user about new device login
   */
  static notifyNewDeviceLogin(userId: string, deviceInfo: IDeviceInfo): void {
    this.emitToUser(userId, 'new-device-login', {
      deviceInfo,
      timestamp: new Date()
    });
  }

  /**
   * Notify user about suspicious activity
   */
  static notifySuspiciousActivity(userId: string, details: any): void {
    this.emitToUser(userId, 'suspicious-activity', {
      details,
      timestamp: new Date()
    });
  }
}
import winston from 'winston';
import config from '../config/config';
import { Request } from 'express';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Custom format to include request context
const requestContextFormat = winston.format((info, opts) => {
  if (info.req) {
    const req = info.req as Request;
    // Add device info if available
    if (req.deviceInfo) {
      info.deviceInfo = req.deviceInfo;
    }
    // Add user info if available
    if (req.user) {
      info.userId = req.user._id;
      info.userRole = req.user.role;
    }
    // Add request details
    info.requestId = req.headers['x-request-id'] || 'unknown';
    info.method = req.method;
    info.url = req.originalUrl || req.url;
    info.ip = req.ip || req.socket.remoteAddress;
    
    // Remove the request object to avoid circular references
    delete info.req;
  }
  return info;
});

// Create logger instance
const logger = winston.createLogger({
  level: config.logs,
  format: winston.format.combine(
    requestContextFormat(),
    logFormat
  ),
  defaultMeta: { service: 'law-firm-api' },
  transports: [
    // Write logs with level 'error' and below to error.log
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Write all logs to combined.log
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Helper function to log with request context
export const logWithRequest = (level: string, message: string, req: Request, meta: Record<string, any> = {}) => {
  logger.log({
    level,
    message,
    req,
    ...meta
  });
};

// If we're not in production, also log to the console
if (config.env !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

export default logger;
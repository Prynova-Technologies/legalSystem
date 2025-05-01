import { Request, Response, NextFunction } from 'express';
import { logWithRequest } from '../utils/logger';

/**
 * Middleware to log all incoming requests with device information
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Capture original URL and method
  const { method, originalUrl } = req;
  
  // Log the request with device info
  logWithRequest('info', `Incoming request: ${method} ${originalUrl}`, req, {
    query: req.query,
    params: req.params,
    // Don't log sensitive information like passwords
    body: sanitizeRequestBody(req.body)
  });
  
  // Track response
  const originalSend = res.send;
  res.send = function(body) {
    // Log response status
    logWithRequest('info', `Response: ${method} ${originalUrl} - ${res.statusCode}`, req, {
      responseTime: Date.now() - (req.deviceInfo?.timestamp?.getTime() || Date.now())
    });
    
    return originalSend.call(this, body);
  };
  
  next();
};

/**
 * Sanitize request body to remove sensitive information
 */
const sanitizeRequestBody = (body: any): any => {
  if (!body) return {};
  
  const sanitized = { ...body };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'passwordConfirm', 'currentPassword', 'newPassword', 
                          'token', 'refreshToken', 'accessToken', 'secret', 'apiKey'];
  
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};
import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import config from '../config/config';
import logger from '../utils/logger';

/**
 * Custom Error class for API errors
 */
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Convert various error types to ApiError
 */
export const errorConverter = (err: any, req: Request, res: Response, next: NextFunction): void => {
  let error = err;
  
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 
      (error instanceof mongoose.Error ? httpStatus.BAD_REQUEST : httpStatus.INTERNAL_SERVER_ERROR);
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, false, err.stack);
  }
  
  next(error);
};

/**
 * Global error handler
 */
export const errorHandler = (err: ApiError, req: Request, res: Response, next: NextFunction): void => {
  let { statusCode, message } = err;
  
  if (config.env === 'production' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = 'Internal Server Error';
  }

  const response = {
    success: false,
    code: statusCode,
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  if (config.env === 'development') {
    logger.error(err);
  }

  res.status(statusCode).json(response);
};
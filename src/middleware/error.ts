import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handling middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction // eslint-disable-line @typescript-eslint/no-unused-vars, no-unused-vars
): void => {
  let statusCode = 500;
  let message = 'Internal server error';

  // Handle known error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (error.name === 'MongoError' && (error as unknown as { code: number }).code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Log error
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    statusCode,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Send error response
  sendError(res, message, statusCode);
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, `Route ${req.originalUrl} not found`, 404);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Unhandled promise rejection handler
export const handleUnhandledRejection = (): void => {
  process.on('unhandledRejection', (reason: unknown, _promise: Promise<unknown>) => { // eslint-disable-line @typescript-eslint/no-unused-vars, no-unused-vars
    logger.error('Unhandled Promise Rejection', {
      reason: (reason as Error)?.message || reason,
      stack: (reason as Error)?.stack,
    });
    
    // Close server gracefully
    process.exit(1);
  });
};

// Uncaught exception handler
export const handleUncaughtException = (): void => {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', {
      message: error.message,
      stack: error.stack,
    });
    
    // Close server gracefully
    process.exit(1);
  });
};

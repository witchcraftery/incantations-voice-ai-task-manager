import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('❌ Unhandled error:', err);

  // Default error
  let error = {
    status: 500,
    message: 'Internal server error'
  };

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = { status: 401, message: 'Invalid token' };
  } else if (err.name === 'TokenExpiredError') {
    error = { status: 401, message: 'Token expired' };
  }

  // Validation errors
  if (err.name === 'ZodError') {
    error = { status: 400, message: 'Validation error' };
  }

  // Database errors
  if (err.code === '23505') { // Unique constraint violation
    error = { status: 409, message: 'Resource already exists' };
  }

  res.status(error.status).json({
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

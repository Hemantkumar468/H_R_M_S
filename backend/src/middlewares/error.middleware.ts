import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/appError';
import { logger } from '../config/logger';
import { env } from '../config/env.config';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: Record<string, string[]> | string | undefined;

  // Handle known AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  }
  // Handle Zod Validation Error
  else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    const fieldErrors: Record<string, string[]> = {};
    err.errors.forEach((issue) => {
      const path = issue.path.join('.') || 'body';
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }
      fieldErrors[path].push(issue.message);
    });
    errors = fieldErrors;
  }
  // Handle Mongoose CastError (e.g. invalid ObjectId)
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid resource identifier format`;
  }
  // Handle Mongoose Duplicate Key Error (E11000)
  else if ((err as unknown as { code?: number }).code === 11000) {
    statusCode = 409;
    const keyValue = (err as unknown as { keyValue?: Record<string, unknown> }).keyValue;
    const duplicateField = keyValue ? Object.keys(keyValue)[0] : 'field';
    message = `A record with this ${duplicateField} already exists`;
  }
  // Handle Mongoose Validation Error
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Database validation failed';
    const validationErrors: Record<string, string[]> = {};
    const mongooseErrors = (err as unknown as { errors: Record<string, { message: string }> })
      .errors;
    if (mongooseErrors) {
      Object.keys(mongooseErrors).forEach((key) => {
        validationErrors[key] = [mongooseErrors[key].message];
      });
    }
    errors = validationErrors;
  }
  // Handle JWT Error
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
  }

  // Log unexpected errors
  if (statusCode >= 500) {
    logger.error('💥 Unhandled Exception:', {
      message: err.message,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
    });
  } else {
    logger.warn('⚠️ Operational Error:', {
      statusCode,
      message,
      path: req.originalUrl,
      method: req.method,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(env.NODE_ENV === 'development' && statusCode >= 500 && { stack: err.stack }),
  });
};

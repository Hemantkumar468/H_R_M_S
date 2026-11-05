import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

import { Response } from 'express';
import { ApiResponse, ApiResponseMeta } from '@hrms/shared';

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  options: {
    success: boolean;
    message: string;
    data?: T;
    meta?: ApiResponseMeta;
    errors?: Record<string, string[]> | string;
  },
): Response => {
  const body: ApiResponse<T> = {
    success: options.success,
    message: options.message,
    ...(options.data !== undefined && { data: options.data }),
    ...(options.meta !== undefined && { meta: options.meta }),
    ...(options.errors !== undefined && { errors: options.errors }),
  };

  return res.status(statusCode).json(body);
};

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  meta?: ApiResponseMeta,
  statusCode = 200,
): Response => {
  return sendResponse(res, statusCode, {
    success: true,
    message,
    data,
    meta,
  });
};

export const sendCreated = <T>(res: Response, message: string, data?: T): Response => {
  return sendResponse(res, 201, {
    success: true,
    message,
    data,
  });
};

export const sendPaginated = <T>(
  res: Response,
  message: string,
  data: T,
  meta: ApiResponseMeta,
): Response => {
  return sendResponse(res, 200, {
    success: true,
    message,
    data,
    meta,
  });
};

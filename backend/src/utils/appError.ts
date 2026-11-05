export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: Record<string, string[]> | string;

  constructor(
    message: string,
    statusCode = 500,
    errors?: Record<string, string[]> | string,
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errors?: Record<string, string[]> | string) {
    return new AppError(message, 400, errors);
  }

  static unauthorized(message = 'Unauthorized access') {
    return new AppError(message, 401);
  }

  static forbidden(message = 'Access forbidden: Insufficient permissions') {
    return new AppError(message, 403);
  }

  static notFound(message = 'Resource not found') {
    return new AppError(message, 404);
  }

  static conflict(message: string) {
    return new AppError(message, 409);
  }

  static internal(message = 'Internal server error') {
    return new AppError(message, 500, undefined, false);
  }
}

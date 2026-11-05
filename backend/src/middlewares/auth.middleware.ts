import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole, Permission, ROLE_PERMISSIONS } from '@hrms/shared';
import { AppError } from '../utils/appError';
import { env } from '../config/env.config';
import { UserModel } from '../models/User';

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  employeeId?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    let token = '';

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      return next(AppError.unauthorized('Authentication token is required'));
    }

    // Verify token
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthUserPayload;

    // Verify user exists and is active
    const user = await UserModel.findById(decoded.userId).select('isActive role employeeId email');
    if (!user || !user.isActive) {
      return next(AppError.unauthorized('User not found or account is deactivated'));
    }

    req.user = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      employeeId: user.employeeId?.toString(),
    };

    next();
  } catch (error: unknown) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(AppError.unauthorized('Access token expired. Please refresh your token.'));
    }
    return next(AppError.unauthorized('Invalid authentication token'));
  }
};

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        AppError.forbidden(`Access denied: Requires one of [${allowedRoles.join(', ')}] roles`),
      );
    }

    next();
  };
};

export const requirePermission = (...requiredPermissions: Permission[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
    const hasAll = requiredPermissions.every((perm) => userPermissions.includes(perm));

    if (!hasAll) {
      return next(AppError.forbidden('Access denied: Insufficient role permissions'));
    }

    next();
  };
};

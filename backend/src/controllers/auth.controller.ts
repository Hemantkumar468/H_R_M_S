import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { env } from '../config/env.config';
import { recordAuditLog } from '../services/auditLog.service';
import { AuditAction } from '@hrms/shared';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export class AuthController {
  static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = LoginSchema.parse(req.body);
    const result = await AuthService.login(email, password);

    // Set refresh token in httpOnly secure cookie
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Record Audit Log for login
    await recordAuditLog({
      userId: result.user.userId,
      userEmail: result.user.email,
      userRole: result.user.role,
      action: AuditAction.LOGIN,
      entity: 'USER',
      entityId: result.user.userId,
      details: `User ${result.user.email} signed in successfully`,
      req,
    });

    return sendSuccess(res, 'Login successful', {
      user: result.user,
      accessToken: result.accessToken,
    });
  });

  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refresh_token || req.body.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token missing' });
    }

    const tokens = await AuthService.refresh(refreshToken);

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return sendSuccess(res, 'Token refreshed successfully', {
      accessToken: tokens.accessToken,
    });
  });

  static logout = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refresh_token;
    if (req.user?.userId) {
      await AuthService.logout(req.user.userId, refreshToken);
    }

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return sendSuccess(res, 'Logged out successfully');
  });

  static getMe = asyncHandler(async (req: Request, res: Response) => {
    const userSession = await AuthService.getMe(req.user!.userId);
    return sendSuccess(res, 'User session retrieved', userSession);
  });
}

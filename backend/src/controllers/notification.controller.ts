import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/appError';

export class NotificationController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw AppError.unauthorized();
    }

    const limit = req.query.limit ? Number(req.query.limit) : 30;
    const feed = await NotificationService.getUserNotifications(req.user.userId, limit);

    return sendSuccess(res, 'Notifications retrieved successfully', feed);
  });

  static markRead = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw AppError.unauthorized();
    }

    const { id } = req.params;
    const notification = await NotificationService.markAsRead(id, req.user.userId);
    if (!notification) {
      throw AppError.notFound('Notification not found');
    }

    return sendSuccess(res, 'Notification marked as read', notification);
  });

  static markAllRead = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw AppError.unauthorized();
    }

    await NotificationService.markAllAsRead(req.user.userId);
    return sendSuccess(res, 'All notifications marked as read');
  });
}

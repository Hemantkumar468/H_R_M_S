import mongoose from 'mongoose';
import { NotificationType, LeaveStatus, UserRole } from '@hrms/shared';
import { NotificationModel, INotificationDocument } from '../models/Notification';
import { EmployeeModel, IEmployeeDocument } from '../models/Employee';
import { UserModel } from '../models/User';
import { ILeaveRequestDocument } from '../models/LeaveRequest';
import { logger } from '../config/logger';

export interface CreateNotificationParams {
  userId: string | mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export class NotificationService {
  static async createNotification(
    params: CreateNotificationParams,
  ): Promise<INotificationDocument | null> {
    try {
      const notification = await NotificationModel.create({
        user: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
        isRead: false,
      });
      return notification;
    } catch (error) {
      logger.error('Failed to create notification:', error);
      return null;
    }
  }

  /**
   * When an employee applies for leave, notify their reporting manager.
   * If there is no reporting manager, notify all active Super Admins & HR Admins.
   */
  static async notifyLeaveApplied(
    leaveRequest: ILeaveRequestDocument,
    applicantEmployee: IEmployeeDocument,
  ): Promise<void> {
    try {
      const employeeName = `${applicantEmployee.firstName} ${applicantEmployee.lastName}`;
      const title = `New Leave Request: ${employeeName}`;
      const message = `${employeeName} applied for ${leaveRequest.daysCount} day(s) leave from ${leaveRequest.startDate} to ${leaveRequest.endDate}. Reason: "${leaveRequest.reason}"`;
      const link = '/leaves';

      if (applicantEmployee.reportingManagerId) {
        // Find the manager's User account
        const managerEmp = await EmployeeModel.findById(applicantEmployee.reportingManagerId);
        if (managerEmp) {
          const managerUser = managerEmp.userId
            ? await UserModel.findById(managerEmp.userId)
            : await UserModel.findOne({ employeeId: managerEmp._id, isActive: true });

          if (managerUser && managerUser.isActive) {
            await this.createNotification({
              userId: managerUser._id,
              type: NotificationType.LEAVE_APPLIED,
              title,
              message,
              link,
            });
            return;
          }
        }
      }

      // Fallback: Notify all active Super Admins and HR Admins
      const hrAndAdmins =
        (await UserModel.find({
          role: { $in: [UserRole.SUPER_ADMIN, UserRole.HR_ADMIN] },
          isActive: true,
        })) || [];

      if (Array.isArray(hrAndAdmins)) {
        await Promise.all(
          hrAndAdmins.map((user) =>
            this.createNotification({
              userId: user._id,
              type: NotificationType.LEAVE_APPLIED,
              title,
              message,
              link,
            }),
          ),
        );
      }
    } catch (error) {
      logger.error('Error sending leave applied notification:', error);
    }
  }

  /**
   * When a leave is approved or rejected, notify the employee.
   */
  static async notifyLeaveResolved(
    leaveRequest: ILeaveRequestDocument,
    status: LeaveStatus,
    managerComment?: string,
  ): Promise<void> {
    try {
      const employee = await EmployeeModel.findById(leaveRequest.employeeId);
      if (!employee) return;

      const user = employee.userId
        ? await UserModel.findById(employee.userId)
        : await UserModel.findOne({ employeeId: employee._id, isActive: true });

      if (!user || !user.isActive) return;

      const isApproved = status === LeaveStatus.APPROVED;
      const title = isApproved ? 'Leave Request Approved' : 'Leave Request Rejected';
      const commentText = managerComment ? ` Note: "${managerComment}"` : '';
      const message = `Your leave request from ${leaveRequest.startDate} to ${leaveRequest.endDate} (${leaveRequest.daysCount} days) has been ${status.toLowerCase()}.${commentText}`;
      const link = '/leaves';

      await this.createNotification({
        userId: user._id,
        type: isApproved ? NotificationType.LEAVE_APPROVED : NotificationType.LEAVE_REJECTED,
        title,
        message,
        link,
      });
    } catch (error) {
      logger.error('Error sending leave resolved notification:', error);
    }
  }

  static async getUserNotifications(userId: string, limit = 30) {
    const [notifications, unreadCount] = await Promise.all([
      NotificationModel.find({ user: userId }).sort({ createdAt: -1 }).limit(limit).lean(),
      NotificationModel.countDocuments({ user: userId, isRead: false }),
    ]);

    return {
      notifications,
      unreadCount,
    };
  }

  static async markAsRead(notificationId: string, userId: string) {
    const updated = await NotificationModel.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true },
      { new: true },
    );
    return updated;
  }

  static async markAllAsRead(userId: string) {
    await NotificationModel.updateMany({ user: userId, isRead: false }, { isRead: true });
    return true;
  }
}

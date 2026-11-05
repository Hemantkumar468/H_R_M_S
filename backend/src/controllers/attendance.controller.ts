import { Request, Response } from 'express';
import {
  CheckInSchema,
  RegularizeAttendanceSchema,
  ApproveRejectRegularizationSchema,
  AuditAction,
  UserRole,
} from '@hrms/shared';
import { AttendanceService } from '../services/attendance.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { recordAuditLog } from '../services/auditLog.service';
import { AppError } from '../utils/appError';

export class AttendanceController {
  static checkIn = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.employeeId) {
      throw AppError.badRequest('No employee profile linked to current user session');
    }

    const validated = CheckInSchema.parse(req.body);
    const record = await AttendanceService.checkIn(req.user.employeeId, validated);
    return sendSuccess(res, 'Checked in successfully', record);
  });

  static checkOut = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.employeeId) {
      throw AppError.badRequest('No employee profile linked to current user session');
    }

    const validated = CheckInSchema.parse(req.body);
    const record = await AttendanceService.checkOut(req.user.employeeId, validated);
    return sendSuccess(res, 'Checked out successfully', record);
  });

  static getTodayStatus = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.employeeId) {
      return sendSuccess(res, 'No employee record found', null);
    }

    const record = await AttendanceService.getTodayStatus(req.user.employeeId);
    return sendSuccess(res, 'Today attendance status', record);
  });

  static getMyAttendance = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.employeeId) {
      throw AppError.badRequest('No employee profile linked to current user session');
    }

    const month = req.query.month ? Number(req.query.month) : new Date().getMonth() + 1;
    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();

    const records = await AttendanceService.getEmployeeAttendance(req.user.employeeId, month, year);
    return sendSuccess(res, 'Attendance history retrieved', records);
  });

  static getTeamAttendance = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.employeeId) {
      throw AppError.badRequest('No employee profile linked to current user session');
    }

    const dateStr = req.query.date as string | undefined;
    const records = await AttendanceService.getTeamAttendance(req.user.employeeId, dateStr);
    return sendSuccess(res, 'Team attendance retrieved', records);
  });

  static requestRegularization = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.employeeId) {
      throw AppError.badRequest('No employee profile linked to current user session');
    }

    const validated = RegularizeAttendanceSchema.parse(req.body);
    const record = await AttendanceService.requestRegularization(req.user.employeeId, validated);

    await recordAuditLog({
      userId: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: AuditAction.REGULARIZATION_REQUEST,
      entity: 'ATTENDANCE',
      entityId: record._id.toString(),
      details: `Submitted attendance regularization request for date ${record.date}. Reason: ${validated.reason}`,
      req,
    });

    return sendSuccess(res, 'Regularization request submitted for approval', record);
  });

  static listPendingRegularizations = asyncHandler(async (req: Request, res: Response) => {
    const isSuperOrHr =
      req.user?.role === UserRole.SUPER_ADMIN || req.user?.role === UserRole.HR_ADMIN;
    const managerId = isSuperOrHr ? undefined : req.user?.employeeId;

    const list = await AttendanceService.listPendingRegularizations(managerId);
    return sendSuccess(res, 'Pending regularization requests retrieved', list);
  });

  static resolveRegularization = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.employeeId) {
      throw AppError.badRequest('No employee profile linked to resolver user session');
    }

    const validated = ApproveRejectRegularizationSchema.parse(req.body);
    const record = await AttendanceService.resolveRegularization(
      req.params.id,
      req.user.employeeId,
      validated,
    );

    const action =
      validated.status === 'APPROVED'
        ? AuditAction.REGULARIZATION_APPROVE
        : AuditAction.REGULARIZATION_REJECT;

    await recordAuditLog({
      userId: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      action,
      entity: 'ATTENDANCE',
      entityId: record._id.toString(),
      details: `${validated.status} attendance regularization for ${record.date}. Comment: ${validated.managerComment || 'None'}`,
      req,
    });

    return sendSuccess(
      res,
      `Regularization ${validated.status.toLowerCase()} successfully`,
      record,
    );
  });
}

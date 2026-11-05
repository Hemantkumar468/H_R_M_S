import { Request, Response } from 'express';
import {
  ApplyLeaveSchema,
  ApproveRejectLeaveSchema,
  CreateLeaveTypeSchema,
  AuditAction,
  UserRole,
} from '@hrms/shared';
import { LeaveService } from '../services/leave.service';
import { LeaveTypeModel } from '../models/LeaveType';
import { sendSuccess, sendCreated } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { recordAuditLog } from '../services/auditLog.service';
import { AppError } from '../utils/appError';

export class LeaveController {
  static getLeaveTypes = asyncHandler(async (_req: Request, res: Response) => {
    const types = await LeaveTypeModel.find({ isActive: true });
    return sendSuccess(res, 'Leave types retrieved', types);
  });

  static createLeaveType = asyncHandler(async (req: Request, res: Response) => {
    const validated = CreateLeaveTypeSchema.parse(req.body);
    const existing = await LeaveTypeModel.findOne({ code: validated.code });
    if (existing) {
      throw AppError.conflict(`Leave type with code ${validated.code} already exists`);
    }

    const type = await LeaveTypeModel.create(validated);
    return sendCreated(res, 'Leave type created', type);
  });

  static apply = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.employeeId) {
      throw AppError.badRequest('No employee profile linked to current user session');
    }

    const validated = ApplyLeaveSchema.parse(req.body);
    const leave = await LeaveService.applyLeave(req.user.employeeId, validated);

    await recordAuditLog({
      userId: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: AuditAction.LEAVE_APPLY,
      entity: 'LEAVE_REQUEST',
      entityId: leave._id.toString(),
      details: `Applied for leave from ${leave.startDate} to ${leave.endDate} (${leave.daysCount} days). Reason: ${leave.reason}`,
      req,
    });

    return sendCreated(res, 'Leave application submitted successfully', leave);
  });

  static getMyLeaves = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.employeeId) {
      throw AppError.badRequest('No employee profile linked to current user session');
    }

    const leaves = await LeaveService.getEmployeeLeaves(req.user.employeeId);
    return sendSuccess(res, 'My leaves retrieved', leaves);
  });

  static getMyBalances = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.employeeId) {
      throw AppError.badRequest('No employee profile linked to current user session');
    }

    const balances = await LeaveService.getEmployeeLeaveBalances(req.user.employeeId);
    return sendSuccess(res, 'Leave balances retrieved', balances);
  });

  static getByEmployeeId = asyncHandler(async (req: Request, res: Response) => {
    const leaves = await LeaveService.getEmployeeLeaves(req.params.employeeId);
    return sendSuccess(res, 'Employee leaves retrieved', leaves);
  });

  static getBalancesByEmployeeId = asyncHandler(async (req: Request, res: Response) => {
    const balances = await LeaveService.getEmployeeLeaveBalances(req.params.employeeId);
    return sendSuccess(res, 'Employee leave balances retrieved', balances);
  });

  static getTeamCalendar = asyncHandler(async (req: Request, res: Response) => {
    const isSuperOrHr =
      req.user?.role === UserRole.SUPER_ADMIN || req.user?.role === UserRole.HR_ADMIN;
    const managerId = isSuperOrHr ? undefined : req.user?.employeeId;
    const month = req.query.month ? Number(req.query.month) : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;

    const calendarLeaves = await LeaveService.getTeamLeaveCalendar(managerId, month, year);
    return sendSuccess(res, 'Team leave calendar retrieved', calendarLeaves);
  });

  static listPending = asyncHandler(async (req: Request, res: Response) => {
    const isSuperOrHr =
      req.user?.role === UserRole.SUPER_ADMIN || req.user?.role === UserRole.HR_ADMIN;
    const managerId = isSuperOrHr ? undefined : req.user?.employeeId;

    const requests = await LeaveService.listPendingLeaves(managerId);
    return sendSuccess(res, 'Pending leaves retrieved', requests);
  });

  static resolve = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.employeeId) {
      throw AppError.badRequest('No employee profile linked to resolver user session');
    }

    const validated = ApproveRejectLeaveSchema.parse(req.body);
    const resolved = await LeaveService.resolveLeaveRequest(
      req.params.id,
      req.user.employeeId,
      req.user.role,
      validated,
    );

    const action =
      validated.status === 'APPROVED' ? AuditAction.LEAVE_APPROVE : AuditAction.LEAVE_REJECT;

    await recordAuditLog({
      userId: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      action,
      entity: 'LEAVE_REQUEST',
      entityId: resolved._id.toString(),
      details: `${validated.status} leave request for period ${resolved.startDate} to ${resolved.endDate}. Comment: ${validated.managerComment || 'None'}`,
      req,
    });

    return sendSuccess(
      res,
      `Leave request ${validated.status.toLowerCase()} successfully`,
      resolved,
    );
  });
}

import {
  ApplyLeaveDto,
  ApproveRejectLeaveDto,
  LeaveStatus,
  LeaveTypeEnum,
  ILeaveBalance,
  UserRole,
} from '@hrms/shared';
import { LeaveRequestModel, ILeaveRequestDocument } from '../models/LeaveRequest';
import { LeaveTypeModel } from '../models/LeaveType';
import { EmployeeModel } from '../models/Employee';
import { HolidayModel } from '../models/Holiday';
import { NotificationService } from './notification.service';
import { AppError } from '../utils/appError';

export class LeaveService {
  /**
   * Calculates working days count between start and end date (inclusive),
   * strictly skipping Sundays and official company holidays.
   */
  public static async calculateWorkingDaysCount(start: string, end: string): Promise<number> {
    const [sY, sM, sD] = start.split('-').map(Number);
    const [eY, eM, eD] = end.split('-').map(Number);

    const cur = new Date(Date.UTC(sY, sM - 1, sD));
    const targetEnd = new Date(Date.UTC(eY, eM - 1, eD));

    if (cur > targetEnd) {
      throw AppError.badRequest('End date must be on or after start date');
    }

    const holidays = await HolidayModel.find({
      date: { $gte: start, $lte: end },
    }).select('date');
    const holidayDates = new Set(holidays.map((h) => h.date));

    let count = 0;
    while (cur <= targetEnd) {
      const year = cur.getUTCFullYear();
      const month = String(cur.getUTCMonth() + 1).padStart(2, '0');
      const day = String(cur.getUTCDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const isSunday = cur.getUTCDay() === 0;
      const isHoliday = holidayDates.has(dateStr);

      if (!isSunday && !isHoliday) {
        count++;
      }

      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    return count;
  }

  static async applyLeave(employeeId: string, dto: ApplyLeaveDto) {
    const employee = await EmployeeModel.findById(employeeId);
    if (!employee || employee.isDeleted) {
      throw AppError.notFound('Employee record not found');
    }

    const leaveType = await LeaveTypeModel.findById(dto.leaveTypeId);
    if (!leaveType || !leaveType.isActive) {
      throw AppError.badRequest('Invalid or inactive leave type selected');
    }

    // 1. Calculate working days (skipping Sundays & Holidays)
    const daysCount = await this.calculateWorkingDaysCount(dto.startDate, dto.endDate);
    if (daysCount <= 0) {
      throw AppError.badRequest(
        'Selected date range contains no working days (Sundays and holidays are excluded)',
      );
    }

    // 2. Overlap check: block request whose dates overlap any pending or approved leave for this employee
    const overlap = await LeaveRequestModel.findOne({
      employeeId,
      status: { $in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
      startDate: { $lte: dto.endDate },
      endDate: { $gte: dto.startDate },
    });

    if (overlap) {
      throw AppError.conflict(
        `You already have a ${overlap.status.toLowerCase()} leave request (${overlap.startDate} to ${overlap.endDate}) overlapping this period`,
      );
    }

    // 3. Balance deduction check (except unpaid leaves)
    if (leaveType.code !== LeaveTypeEnum.UNPAID) {
      const balances = await this.getEmployeeLeaveBalances(employeeId);
      const matchedBalance = balances.find((b) => b.leaveTypeId === dto.leaveTypeId);
      if (matchedBalance && matchedBalance.available < daysCount) {
        throw AppError.badRequest(
          `Insufficient leave balance for ${leaveType.name}. Available: ${matchedBalance.available} day(s), requested: ${daysCount} day(s)`,
        );
      }
    }

    // 4. Create leave request
    const request = await LeaveRequestModel.create({
      employeeId,
      leaveTypeId: dto.leaveTypeId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      daysCount,
      reason: dto.reason,
      status: LeaveStatus.PENDING,
    });

    // 5. In-app notification to manager (or HR/Admins if no manager)
    await NotificationService.notifyLeaveApplied(request, employee);

    return request;
  }

  static async getEmployeeLeaves(employeeId: string) {
    const leaves = await LeaveRequestModel.find({ employeeId })
      .populate('leaveTypeId', 'name code')
      .populate('approvedBy', 'firstName lastName employeeId')
      .sort({ createdAt: -1 });

    return leaves;
  }

  static async getEmployeeLeaveBalances(employeeId: string): Promise<ILeaveBalance[]> {
    const leaveTypes = await LeaveTypeModel.find({ isActive: true });
    const currentYear = new Date().getFullYear();
    const yearPrefix = `${currentYear}`;

    const balances: ILeaveBalance[] = await Promise.all(
      leaveTypes.map(async (type) => {
        const approvedLeaves = await LeaveRequestModel.find({
          employeeId,
          leaveTypeId: type._id,
          status: LeaveStatus.APPROVED,
          startDate: { $regex: `^${yearPrefix}` },
        });

        const pendingLeaves = await LeaveRequestModel.find({
          employeeId,
          leaveTypeId: type._id,
          status: LeaveStatus.PENDING,
          startDate: { $regex: `^${yearPrefix}` },
        });

        const used = approvedLeaves.reduce((acc, curr) => acc + curr.daysCount, 0);
        const pending = pendingLeaves.reduce((acc, curr) => acc + curr.daysCount, 0);
        const available = Math.max(0, type.daysPerYear - used);

        return {
          leaveTypeId: type._id.toString(),
          leaveTypeName: type.name,
          leaveTypeCode: type.code,
          totalAllocated: type.daysPerYear,
          used,
          pending,
          available,
        };
      }),
    );

    return balances;
  }

  static async getTeamLeaveCalendar(managerEmployeeId?: string, month?: number, year?: number) {
    const targetYear = year || new Date().getFullYear();
    const query: Record<string, unknown> = {
      status: { $in: [LeaveStatus.APPROVED, LeaveStatus.PENDING] },
    };

    if (month) {
      const monthStr = month.toString().padStart(2, '0');
      const monthStart = `${targetYear}-${monthStr}-01`;
      const lastDay = new Date(targetYear, month, 0).getDate();
      const monthEnd = `${targetYear}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
      query.startDate = { $lte: monthEnd };
      query.endDate = { $gte: monthStart };
    } else {
      query.startDate = { $regex: `^${targetYear}` };
    }

    if (managerEmployeeId) {
      const reports = await EmployeeModel.find({
        reportingManagerId: managerEmployeeId,
        isDeleted: false,
      }).select('_id');
      const reportIds = reports.map((r) => r._id);
      reportIds.push(managerEmployeeId as any);
      query.employeeId = { $in: reportIds };
    }

    const calendarLeaves = await LeaveRequestModel.find(query)
      .populate('employeeId', 'firstName lastName employeeId departmentId avatarUrl')
      .populate('leaveTypeId', 'name code')
      .sort({ startDate: 1 });

    return calendarLeaves;
  }

  static async listPendingLeaves(managerEmployeeId?: string) {
    const query: Record<string, unknown> = {
      status: LeaveStatus.PENDING,
    };

    if (managerEmployeeId) {
      const reports = await EmployeeModel.find({
        reportingManagerId: managerEmployeeId,
        isDeleted: false,
      }).select('_id');
      const reportIds = reports.map((r) => r._id);
      query.employeeId = { $in: reportIds };
    }

    const requests = await LeaveRequestModel.find(query)
      .populate('employeeId', 'firstName lastName employeeId departmentId')
      .populate('leaveTypeId', 'name code')
      .sort({ createdAt: -1 });

    return requests;
  }

  static async resolveLeaveRequest(
    leaveId: string,
    resolverEmployeeId: string,
    resolverRole: UserRole,
    dto: ApproveRejectLeaveDto,
  ): Promise<ILeaveRequestDocument> {
    const request = await LeaveRequestModel.findById(leaveId);
    if (!request) {
      throw AppError.notFound('Leave request not found');
    }

    if (request.status !== LeaveStatus.PENDING) {
      throw AppError.badRequest('This leave request has already been processed');
    }

    // 1. Self-approval rule: Nobody can approve their own leave (except Super Admin)
    const applicantEmpId = request.employeeId.toString();
    if (applicantEmpId === resolverEmployeeId && resolverRole !== UserRole.SUPER_ADMIN) {
      throw AppError.forbidden('You cannot approve or reject your own leave request');
    }

    // 2. Manager permission rule: Managers can only approve requests for their direct reports
    if (resolverRole === UserRole.MANAGER) {
      const applicant = await EmployeeModel.findById(request.employeeId);
      if (!applicant || applicant.reportingManagerId?.toString() !== resolverEmployeeId) {
        throw AppError.forbidden(
          'Managers can only approve or reject leave requests for their own team members',
        );
      }
    }

    request.status = dto.status;
    request.managerComment = dto.managerComment;
    request.approvedBy = resolverEmployeeId as any;

    await request.save();

    // 3. Notify the employee about the resolution
    await NotificationService.notifyLeaveResolved(request, dto.status, dto.managerComment);

    return request;
  }
}

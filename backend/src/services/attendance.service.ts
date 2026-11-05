import {
  AttendanceStatus,
  RegularizationStatus,
  CheckInDto,
  RegularizeAttendanceDto,
  ApproveRejectRegularizationDto,
} from '@hrms/shared';
import { AttendanceModel, IAttendanceDocument } from '../models/Attendance';
import { EmployeeModel } from '../models/Employee';
import { AppError } from '../utils/appError';

export class AttendanceService {
  private static getTodayDateString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  static async checkIn(employeeId: string, dto: CheckInDto) {
    const todayStr = this.getTodayDateString();

    let record = await AttendanceModel.findOne({ employeeId, date: todayStr });
    if (record && record.checkIn) {
      throw AppError.badRequest('You have already checked in for today');
    }

    const now = new Date();
    // Standard business start time: 9:30 AM
    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);

    if (!record) {
      record = new AttendanceModel({
        employeeId,
        date: todayStr,
        checkIn: now,
        isLate,
        status: isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
        location: {
          checkInLatitude: dto.latitude,
          checkInLongitude: dto.longitude,
          checkInLocation: dto.locationName || 'Office / Web',
        },
      });
    } else {
      record.checkIn = now;
      record.isLate = isLate;
      record.status = isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;
      if (dto.latitude && dto.longitude) {
        record.location = {
          ...record.location,
          checkInLatitude: dto.latitude,
          checkInLongitude: dto.longitude,
          checkInLocation: dto.locationName || 'Office / Web',
        };
      }
    }

    await record.save();
    return record;
  }

  static async checkOut(employeeId: string, dto: CheckInDto) {
    const todayStr = this.getTodayDateString();

    const record = await AttendanceModel.findOne({ employeeId, date: todayStr });
    if (!record || !record.checkIn) {
      throw AppError.badRequest('You must check in before checking out');
    }

    const now = new Date();
    record.checkOut = now;

    // Calculate working hours
    const diffMs = now.getTime() - record.checkIn.getTime();
    const workingHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
    record.workingHours = workingHours;

    // Overtime & Early Leave
    record.isEarlyLeave = workingHours < 8;
    record.overtimeHours = workingHours > 8.5 ? Number((workingHours - 8.5).toFixed(2)) : 0;

    // Status: half day if less than 4.5 hours
    if (workingHours < 4.5) {
      record.status = AttendanceStatus.HALF_DAY;
    } else {
      record.status = record.isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;
    }

    if (dto.latitude && dto.longitude) {
      record.location = {
        ...record.location,
        checkOutLatitude: dto.latitude,
        checkOutLongitude: dto.longitude,
        checkOutLocation: dto.locationName || 'Office / Web',
      };
    }

    await record.save();
    return record;
  }

  static async getTodayStatus(employeeId: string) {
    const todayStr = this.getTodayDateString();
    const record = await AttendanceModel.findOne({ employeeId, date: todayStr });
    return record;
  }

  static async getEmployeeAttendance(employeeId: string, month: number, year: number) {
    const monthStr = month.toString().padStart(2, '0');
    const regex = new RegExp(`^${year}-${monthStr}`);

    const records = await AttendanceModel.find({
      employeeId,
      date: { $regex: regex },
    }).sort({ date: 1 });

    return records;
  }

  static async getTeamAttendance(managerEmployeeId: string, dateStr?: string) {
    const targetDate = dateStr || this.getTodayDateString();

    // Find direct reports
    const reportees = await EmployeeModel.find({
      reportingManagerId: managerEmployeeId,
      isDeleted: false,
    }).select('_id firstName lastName employeeId');

    const reporteeIds = reportees.map((r) => r._id);

    const attendances = await AttendanceModel.find({
      employeeId: { $in: reporteeIds },
      date: targetDate,
    }).populate('employeeId', 'firstName lastName employeeId');

    return attendances;
  }

  static async requestRegularization(employeeId: string, dto: RegularizeAttendanceDto) {
    const record = await AttendanceModel.findOne({
      _id: dto.attendanceId,
      employeeId,
    });

    if (!record) {
      throw AppError.notFound('Attendance record not found');
    }

    if (record.regularizationStatus === RegularizationStatus.PENDING) {
      throw AppError.badRequest('A regularization request is already pending for this date');
    }

    record.requestedCheckIn = new Date(dto.requestedCheckIn);
    record.requestedCheckOut = new Date(dto.requestedCheckOut);
    record.regularizationReason = dto.reason;
    record.regularizationStatus = RegularizationStatus.PENDING;
    record.regularizationManagerComment = undefined;

    await record.save();
    return record;
  }

  static async listPendingRegularizations(managerEmployeeId?: string) {
    const query: Record<string, unknown> = {
      regularizationStatus: RegularizationStatus.PENDING,
    };

    if (managerEmployeeId) {
      const directReports = await EmployeeModel.find({
        reportingManagerId: managerEmployeeId,
        isDeleted: false,
      }).select('_id');
      const directReportIds = directReports.map((d) => d._id);
      query.employeeId = { $in: directReportIds };
    }

    const requests = await AttendanceModel.find(query)
      .populate('employeeId', 'firstName lastName employeeId departmentId designationId')
      .sort({ createdAt: -1 });

    return requests;
  }

  static async resolveRegularization(
    attendanceId: string,
    resolverEmployeeId: string,
    dto: ApproveRejectRegularizationDto,
  ): Promise<IAttendanceDocument> {
    const record = await AttendanceModel.findById(attendanceId).populate('employeeId');
    if (!record) {
      throw AppError.notFound('Attendance record not found');
    }

    if (record.regularizationStatus !== RegularizationStatus.PENDING) {
      throw AppError.badRequest('This regularization request is not pending approval');
    }

    record.regularizationStatus = dto.status;
    record.regularizationManagerComment = dto.managerComment;
    record.regularizationResolvedBy = resolverEmployeeId as any;
    record.regularizationResolvedAt = new Date();

    if (dto.status === RegularizationStatus.APPROVED) {
      if (record.requestedCheckIn) record.checkIn = record.requestedCheckIn;
      if (record.requestedCheckOut) record.checkOut = record.requestedCheckOut;

      if (record.checkIn && record.checkOut) {
        const diffMs = record.checkOut.getTime() - record.checkIn.getTime();
        record.workingHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
        record.isEarlyLeave = record.workingHours < 8;
        record.status = AttendanceStatus.PRESENT;
      }
    }

    await record.save();
    return record;
  }
}

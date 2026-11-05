import { Request, Response } from 'express';
import { CreateHolidaySchema, AuditAction } from '@hrms/shared';
import { HolidayService } from '../services/holiday.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { recordAuditLog } from '../services/auditLog.service';

export class HolidayController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    const year = req.query.year ? Number(req.query.year) : undefined;
    const holidays = await HolidayService.listHolidays(year);
    return sendSuccess(res, 'Holidays retrieved successfully', holidays);
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const validated = CreateHolidaySchema.parse(req.body);
    const holiday = await HolidayService.createHoliday(validated);

    await recordAuditLog({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: AuditAction.CREATE,
      entity: 'HOLIDAY',
      entityId: holiday._id.toString(),
      details: `Added holiday: "${holiday.title}" on ${holiday.date}`,
      req,
    });

    return sendCreated(res, 'Holiday added successfully', holiday);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const deleted = await HolidayService.deleteHoliday(req.params.id);

    await recordAuditLog({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: AuditAction.DELETE,
      entity: 'HOLIDAY',
      entityId: deleted._id.toString(),
      details: `Deleted holiday: "${deleted.title}" on ${deleted.date}`,
      req,
    });

    return sendSuccess(res, 'Holiday deleted successfully');
  });
}

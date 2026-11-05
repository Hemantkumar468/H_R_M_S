import { Request, Response } from 'express';
import {
  CreateDesignationSchema,
  UpdateDesignationSchema,
  PaginationQuerySchema,
  AuditAction,
} from '@hrms/shared';
import { DesignationService } from '../services/designation.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { recordAuditLog } from '../services/auditLog.service';

export class DesignationController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const validated = CreateDesignationSchema.parse(req.body);
    const designation = await DesignationService.createDesignation(validated);

    await recordAuditLog({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: AuditAction.CREATE,
      entity: 'DESIGNATION',
      entityId: designation._id.toString(),
      details: `Created designation "${designation.name}" (${designation.code})`,
      diff: { after: designation.toObject() as unknown as Record<string, unknown> },
      req,
    });

    return sendCreated(res, 'Designation created successfully', designation);
  });

  static list = asyncHandler(async (req: Request, res: Response) => {
    const params = PaginationQuerySchema.parse(req.query);
    const departmentId = req.query.departmentId as string | undefined;
    const result = await DesignationService.listDesignations({ ...params, departmentId });
    return sendSuccess(
      res,
      'Designations retrieved successfully',
      result.designations,
      result.meta,
    );
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const designation = await DesignationService.getDesignationById(req.params.id);
    return sendSuccess(res, 'Designation retrieved successfully', designation);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const validated = UpdateDesignationSchema.parse(req.body);
    const oldDesig = await DesignationService.getDesignationById(req.params.id);
    const updated = await DesignationService.updateDesignation(req.params.id, validated);

    await recordAuditLog({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: AuditAction.UPDATE,
      entity: 'DESIGNATION',
      entityId: updated._id.toString(),
      details: `Updated designation "${updated.name}" (${updated.code})`,
      diff: {
        before: oldDesig.toObject() as unknown as Record<string, unknown>,
        after: updated.toObject() as unknown as Record<string, unknown>,
      },
      req,
    });

    return sendSuccess(res, 'Designation updated successfully', updated);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const deleted = await DesignationService.deleteDesignation(req.params.id);

    await recordAuditLog({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: AuditAction.DELETE,
      entity: 'DESIGNATION',
      entityId: deleted._id.toString(),
      details: `Deleted designation "${deleted.name}" (${deleted.code})`,
      req,
    });

    return sendSuccess(res, 'Designation deleted successfully');
  });
}

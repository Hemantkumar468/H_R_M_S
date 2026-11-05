import { Request, Response } from 'express';
import {
  CreateDepartmentSchema,
  UpdateDepartmentSchema,
  PaginationQuerySchema,
  AuditAction,
} from '@hrms/shared';
import { DepartmentService } from '../services/department.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { recordAuditLog } from '../services/auditLog.service';

export class DepartmentController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const validated = CreateDepartmentSchema.parse(req.body);
    const department = await DepartmentService.createDepartment(validated);

    await recordAuditLog({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: AuditAction.CREATE,
      entity: 'DEPARTMENT',
      entityId: department._id.toString(),
      details: `Created department "${department.name}" (${department.code})`,
      diff: { after: department.toObject() as unknown as Record<string, unknown> },
      req,
    });

    return sendCreated(res, 'Department created successfully', department);
  });

  static list = asyncHandler(async (req: Request, res: Response) => {
    const params = PaginationQuerySchema.parse(req.query);
    const result = await DepartmentService.listDepartments(params);
    return sendSuccess(res, 'Departments retrieved successfully', result.departments, result.meta);
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const department = await DepartmentService.getDepartmentById(req.params.id);
    return sendSuccess(res, 'Department retrieved successfully', department);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const validated = UpdateDepartmentSchema.parse(req.body);
    const oldDept = await DepartmentService.getDepartmentById(req.params.id);
    const updated = await DepartmentService.updateDepartment(req.params.id, validated);

    await recordAuditLog({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: AuditAction.UPDATE,
      entity: 'DEPARTMENT',
      entityId: updated._id.toString(),
      details: `Updated department "${updated.name}" (${updated.code})`,
      diff: {
        before: oldDept.toObject() as unknown as Record<string, unknown>,
        after: updated.toObject() as unknown as Record<string, unknown>,
      },
      req,
    });

    return sendSuccess(res, 'Department updated successfully', updated);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const deleted = await DepartmentService.deleteDepartment(req.params.id);

    await recordAuditLog({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: AuditAction.DELETE,
      entity: 'DEPARTMENT',
      entityId: deleted._id.toString(),
      details: `Deleted department "${deleted.name}" (${deleted.code})`,
      req,
    });

    return sendSuccess(res, 'Department deleted successfully');
  });
}

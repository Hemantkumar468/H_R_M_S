import { Request, Response } from 'express';
import {
  CreateEmployeeSchema,
  UpdateEmployeeSchema,
  UpdateEmployeeStatusSchema,
  PaginationQuerySchema,
  AuditAction,
  EmployeeStatus,
} from '@hrms/shared';
import { EmployeeService } from '../services/employee.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { recordAuditLog } from '../services/auditLog.service';
import { AppError } from '../utils/appError';

export class EmployeeController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const validated = CreateEmployeeSchema.parse(req.body);
    const employee = await EmployeeService.createEmployee(validated);

    await recordAuditLog({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: AuditAction.CREATE,
      entity: 'EMPLOYEE',
      entityId: employee._id.toString(),
      details: `Created new employee profile: ${employee.firstName} ${employee.lastName} (${employee.employeeId})`,
      diff: { after: employee.toObject() as unknown as Record<string, unknown> },
      req,
    });

    return sendCreated(res, 'Employee created successfully', employee);
  });

  static list = asyncHandler(async (req: Request, res: Response) => {
    const params = PaginationQuerySchema.parse(req.query);
    const departmentId = req.query.departmentId as string | undefined;
    const designationId = req.query.designationId as string | undefined;
    const status = req.query.status as EmployeeStatus | undefined;

    const result = await EmployeeService.listEmployees({
      ...params,
      departmentId,
      designationId,
      status,
    });

    return sendSuccess(res, 'Employees retrieved successfully', result.employees, result.meta);
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const employee = await EmployeeService.getEmployeeById(req.params.id);
    return sendSuccess(res, 'Employee profile retrieved', employee);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const validated = UpdateEmployeeSchema.parse(req.body);
    const oldEmp = await EmployeeService.getEmployeeById(req.params.id);
    const updated = await EmployeeService.updateEmployee(req.params.id, validated);

    await recordAuditLog({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: AuditAction.UPDATE,
      entity: 'EMPLOYEE',
      entityId: updated._id.toString(),
      details: `Updated employee profile: ${updated.firstName} ${updated.lastName} (${updated.employeeId})`,
      diff: {
        before: oldEmp.toObject() as unknown as Record<string, unknown>,
        after: updated.toObject() as unknown as Record<string, unknown>,
      },
      req,
    });

    return sendSuccess(res, 'Employee updated successfully', updated);
  });

  static updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const validated = UpdateEmployeeStatusSchema.parse(req.body);
    const oldEmp = await EmployeeService.getEmployeeById(req.params.id);
    const updated = await EmployeeService.updateStatus(req.params.id, validated);

    await recordAuditLog({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: AuditAction.STATUS_CHANGE,
      entity: 'EMPLOYEE',
      entityId: updated._id.toString(),
      details: `Changed employee status from ${oldEmp.status} to ${validated.status}. Remarks: ${validated.remarks || 'None'}`,
      diff: { before: { status: oldEmp.status }, after: { status: validated.status } },
      req,
    });

    return sendSuccess(res, 'Employee status updated successfully', updated);
  });

  static uploadDocument = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw AppError.badRequest('No file was uploaded');
    }

    const { name, documentType } = req.body;
    if (!name || !documentType) {
      throw AppError.badRequest('Document name and documentType are required');
    }

    const fileUrl = `/uploads/documents/${req.file.filename}`;
    const updated = await EmployeeService.addDocument(req.params.id, {
      name,
      documentType,
      fileUrl,
    });

    await recordAuditLog({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: AuditAction.DOCUMENT_UPLOAD,
      entity: 'EMPLOYEE',
      entityId: req.params.id,
      details: `Uploaded document "${name}" (${documentType}) for employee ${updated.employeeId}`,
      req,
    });

    return sendSuccess(res, 'Document uploaded successfully', updated);
  });

  static deleteDocument = asyncHandler(async (req: Request, res: Response) => {
    const { id, documentId } = req.params;
    const updated = await EmployeeService.deleteDocument(id, documentId);

    await recordAuditLog({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: AuditAction.DELETE,
      entity: 'EMPLOYEE_DOCUMENT',
      entityId: documentId,
      details: `Deleted document from employee ${updated.employeeId}`,
      req,
    });

    return sendSuccess(res, 'Document removed successfully', updated);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const deleted = await EmployeeService.deleteEmployee(req.params.id);

    await recordAuditLog({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: AuditAction.DELETE,
      entity: 'EMPLOYEE',
      entityId: deleted._id.toString(),
      details: `Archived/Deleted employee ${deleted.firstName} ${deleted.lastName} (${deleted.employeeId})`,
      req,
    });

    return sendSuccess(res, 'Employee archived successfully');
  });
}

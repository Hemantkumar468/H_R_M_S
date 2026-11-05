import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { SalaryStructureSchema, RunPayrollSchema, AuditAction } from '@hrms/shared';
import { PayrollService } from '../services/payroll.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { recordAuditLog } from '../services/auditLog.service';
import { AppError } from '../utils/appError';

export class PayrollController {
  static getSalaryStructure = asyncHandler(async (req: Request, res: Response) => {
    const employeeId = req.params.employeeId || req.user?.employeeId;
    if (!employeeId) {
      throw AppError.badRequest('Employee ID is required');
    }

    const structure = await PayrollService.getSalaryStructure(employeeId);
    return sendSuccess(res, 'Salary structure retrieved', structure);
  });

  static upsertSalaryStructure = asyncHandler(async (req: Request, res: Response) => {
    const validated = SalaryStructureSchema.parse(req.body);
    const structure = await PayrollService.upsertSalaryStructure(req.params.employeeId, validated);

    await recordAuditLog({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: AuditAction.UPDATE,
      entity: 'SALARY_STRUCTURE',
      entityId: structure._id.toString(),
      details: `Updated salary structure for employee ${req.params.employeeId}. Basic: ${structure.basic}, Gross: ${structure.grossSalary}, Net: ${structure.netSalary}`,
      diff: { after: structure.toObject() as unknown as Record<string, unknown> },
      req,
    });

    return sendSuccess(res, 'Salary structure updated successfully', structure);
  });

  static runPayroll = asyncHandler(async (req: Request, res: Response) => {
    const validated = RunPayrollSchema.parse(req.body);
    const result = await PayrollService.runMonthlyPayroll(validated, req.user?.userId);

    await recordAuditLog({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: AuditAction.PAYROLL_RUN,
      entity: 'PAYROLL',
      details: `Executed payroll run for ${validated.month}/${validated.year}. Processed: ${result.totalEmployeesProcessed} employees, Gross: ${result.totalGross}, Deductions: ${result.totalDeductions}, Net: ${result.totalNet}`,
      req,
    });

    return sendSuccess(res, 'Monthly payroll executed and payslips generated', result);
  });

  static listMonthlyPayroll = asyncHandler(async (req: Request, res: Response) => {
    const month = req.query.month ? Number(req.query.month) : new Date().getMonth() + 1;
    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();

    const records = await PayrollService.listMonthlyPayroll(month, year);
    return sendSuccess(res, `Payroll records for ${month}/${year}`, records);
  });

  static getMyPayslips = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.employeeId) {
      throw AppError.badRequest('No employee profile linked to current user session');
    }

    const payslips = await PayrollService.getEmployeePayslips(req.user.employeeId);
    return sendSuccess(res, 'My payslips retrieved', payslips);
  });

  static downloadPayslip = asyncHandler(async (req: Request, res: Response) => {
    const item = await PayrollService.getPayslipById(req.params.id);

    if (!item.payslipPdfPath) {
      throw AppError.notFound('Payslip PDF has not been generated for this record');
    }

    // Security check: non-admins can only download their own payslip
    if (
      req.user?.role === 'EMPLOYEE' &&
      (item.employeeId as any)._id?.toString() !== req.user.employeeId
    ) {
      throw AppError.forbidden('You are not authorized to download this payslip');
    }

    const fullPath = path.resolve(process.cwd(), item.payslipPdfPath.replace(/^\//, ''));
    if (!fs.existsSync(fullPath)) {
      throw AppError.notFound('Payslip PDF file not found on disk');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="payslip-${item.month}-${item.year}.pdf"`,
    );
    const readStream = fs.createReadStream(fullPath);
    readStream.pipe(res);
  });
}

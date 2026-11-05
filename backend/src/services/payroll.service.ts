import { SalaryStructureDto, RunPayrollDto, EmployeeStatus, PayrollStatus } from '@hrms/shared';
import { SalaryStructureModel } from '../models/SalaryStructure';
import { PayrollItemModel, IPayrollItemDocument } from '../models/PayrollItem';
import { EmployeeModel, IEmployeeDocument } from '../models/Employee';
import { AttendanceModel } from '../models/Attendance';
import { LeaveRequestModel } from '../models/LeaveRequest';
import { generatePayslipPdf } from './payslipPdf.service';
import { AppError } from '../utils/appError';

export class PayrollService {
  static async getSalaryStructure(employeeId: string) {
    const structure = await SalaryStructureModel.findOne({ employeeId }).populate(
      'employeeId',
      'firstName lastName employeeId email',
    );
    if (!structure) {
      throw AppError.notFound('Salary structure not found for this employee');
    }
    return structure;
  }

  static async upsertSalaryStructure(employeeId: string, dto: SalaryStructureDto) {
    const employee = await EmployeeModel.findById(employeeId);
    if (!employee || employee.isDeleted) {
      throw AppError.notFound('Employee not found');
    }

    const structure = await SalaryStructureModel.findOneAndUpdate(
      { employeeId },
      { ...dto, employeeId },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );

    return structure;
  }

  static async runMonthlyPayroll(dto: RunPayrollDto, processedByUserId?: string) {
    const { month, year } = dto;
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthStr = month.toString().padStart(2, '0');

    // Fetch active employees
    const employees = await EmployeeModel.find({
      status: { $in: [EmployeeStatus.ACTIVE, EmployeeStatus.PROBATION] },
      isDeleted: false,
    })
      .populate('departmentId', 'name')
      .populate('designationId', 'name');

    if (employees.length === 0) {
      throw AppError.badRequest('No active employees found to process payroll');
    }

    const results: IPayrollItemDocument[] = [];

    for (const employee of employees) {
      // 1. Get or create default salary structure
      let structure = await SalaryStructureModel.findOne({ employeeId: employee._id });
      if (!structure) {
        structure = await SalaryStructureModel.create({
          employeeId: employee._id,
          basic: 30000,
          hra: 15000,
          conveyance: 1600,
          specialAllowance: 5000,
          medicalAllowance: 1250,
          pfApplicable: true,
          pfEmployeePercent: 12,
          pfEmployerPercent: 12,
          esiApplicable: false,
          professionalTax: 200,
          monthlyTds: 0,
        });
      }

      // 2. Count present days in month
      const attendanceCount = await AttendanceModel.countDocuments({
        employeeId: employee._id,
        date: { $regex: `^${year}-${monthStr}` },
        status: { $in: ['PRESENT', 'LATE'] },
      });

      // Count approved leave days
      const approvedLeaves = await LeaveRequestModel.find({
        employeeId: employee._id,
        status: 'APPROVED',
        startDate: { $regex: `^${year}-${monthStr}` },
      });
      const leaveDays = approvedLeaves.reduce((sum, l) => sum + l.daysCount, 0);

      // Payable days (capped at total days in month)
      const presentDays = Math.min(
        daysInMonth,
        attendanceCount > 0 ? attendanceCount : daysInMonth,
      ); // default full if attendance wasn't logged daily
      const payableDays = Math.min(daysInMonth, presentDays + leaveDays);
      const payFactor = payableDays / daysInMonth;

      // 3. Calculate earnings prorated by payable days
      const basic = Math.round(structure.basic * payFactor);
      const hra = Math.round(structure.hra * payFactor);
      const conveyance = Math.round(structure.conveyance * payFactor);
      const specialAllowance = Math.round(structure.specialAllowance * payFactor);
      const medicalAllowance = Math.round(structure.medicalAllowance * payFactor);
      const grossEarnings = basic + hra + conveyance + specialAllowance + medicalAllowance;

      // 4. Calculate statutory deductions (Indian PF, ESI, PT, TDS)
      const pfEmployee = structure.pfApplicable
        ? Math.round((basic * structure.pfEmployeePercent) / 100)
        : 0;
      const pfEmployer = structure.pfApplicable
        ? Math.round((basic * structure.pfEmployerPercent) / 100)
        : 0;

      const esiEmployee = structure.esiApplicable
        ? Math.round((grossEarnings * structure.esiEmployeePercent) / 100)
        : 0;
      const esiEmployer = structure.esiApplicable
        ? Math.round((grossEarnings * structure.esiEmployerPercent) / 100)
        : 0;

      const professionalTax = structure.professionalTax || 200;
      const tds = structure.monthlyTds || 0;
      const totalDeductions = pfEmployee + esiEmployee + professionalTax + tds;

      const netSalary = Math.max(0, grossEarnings - totalDeductions);

      // 5. Upsert PayrollItem
      let payrollItem = await PayrollItemModel.findOne({
        employeeId: employee._id,
        month,
        year,
      });

      if (!payrollItem) {
        payrollItem = new PayrollItemModel({
          employeeId: employee._id,
          month,
          year,
        });
      }

      payrollItem.totalWorkingDays = daysInMonth;
      payrollItem.presentDays = presentDays;
      payrollItem.paidLeaves = leaveDays;
      payrollItem.payableDays = payableDays;
      payrollItem.earnings = {
        basic,
        hra,
        conveyance,
        specialAllowance,
        medicalAllowance,
        grossEarnings,
      };
      payrollItem.deductions = {
        pfEmployee,
        pfEmployer,
        esiEmployee,
        esiEmployer,
        professionalTax,
        tds,
        totalDeductions,
      };
      payrollItem.netSalary = netSalary;
      payrollItem.status = PayrollStatus.PROCESSED;
      payrollItem.processedBy = processedByUserId as any;

      // 6. Generate Payslip PDF
      const deptName = (employee.departmentId as any)?.name || 'General';
      const desigName = (employee.designationId as any)?.name || 'Executive';
      const pdfPath = await generatePayslipPdf(payrollItem, employee, deptName, desigName);
      payrollItem.payslipPdfPath = pdfPath;

      await payrollItem.save();
      results.push(payrollItem);
    }

    const totalGross = results.reduce((sum, item) => sum + item.earnings.grossEarnings, 0);
    const totalDeductions = results.reduce((sum, item) => sum + item.deductions.totalDeductions, 0);
    const totalNet = results.reduce((sum, item) => sum + item.netSalary, 0);

    return {
      month,
      year,
      totalEmployeesProcessed: results.length,
      totalGross,
      totalDeductions,
      totalNet,
      records: results,
    };
  }

  static async listMonthlyPayroll(month: number, year: number) {
    const records = await PayrollItemModel.find({ month, year })
      .populate(
        'employeeId',
        'firstName lastName employeeId departmentId designationId bankDetails',
      )
      .sort({ createdAt: -1 });

    return records;
  }

  static async getEmployeePayslips(employeeId: string) {
    const records = await PayrollItemModel.find({ employeeId }).sort({ year: -1, month: -1 });

    return records;
  }

  static async getPayslipById(id: string) {
    const item = await PayrollItemModel.findById(id).populate(
      'employeeId',
      'firstName lastName employeeId departmentId designationId bankDetails email',
    );
    if (!item) {
      throw AppError.notFound('Payslip not found');
    }
    return item;
  }
}

import mongoose from 'mongoose';
import { UserRole, Gender, EmployeeStatus, LeaveTypeEnum } from '@hrms/shared';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { UserModel } from '../models/User';
import { DepartmentModel } from '../models/Department';
import { DesignationModel } from '../models/Designation';
import { EmployeeModel } from '../models/Employee';
import { LeaveTypeModel } from '../models/LeaveType';
import { HolidayModel } from '../models/Holiday';
import { SalaryStructureModel } from '../models/SalaryStructure';
import { env } from '../config/env.config';
import { logger } from '../config/logger';

export const seedDatabase = async () => {
  const isProduction = process.env.NODE_ENV === 'production' || env.NODE_ENV === 'production';
  const hasForceFlag = process.argv.includes('--force');

  if (isProduction && !hasForceFlag) {
    logger.error(
      '❌ Database seeding aborted: Seeding in production is blocked. Pass --force to execute.',
    );
    console.error(
      '❌ Database seeding aborted: Seeding in production is blocked because it mutates/overwrites database state. Pass --force to execute.',
    );
    process.exit(1);
  }

  try {
    logger.info('🌱 Starting HRMS database seeding...');
    await connectDatabase();

    // 1. Create or verify Super Admin
    const existingSuperAdmin = await UserModel.findOne({
      email: env.SUPER_ADMIN_EMAIL.toLowerCase(),
    });
    if (!existingSuperAdmin) {
      await UserModel.create({
        email: env.SUPER_ADMIN_EMAIL.toLowerCase(),
        password: env.SUPER_ADMIN_PASSWORD,
        role: UserRole.SUPER_ADMIN,
        isFirstLogin: false,
        isActive: true,
      });
      logger.info(` Created Super Admin: ${env.SUPER_ADMIN_EMAIL}`);
    } else {
      logger.info('ℹ️ Super Admin already exists.');
    }

    // 2. Seed Standard Leave Types
    const leaveTypes = [
      { name: 'Casual Leave', code: LeaveTypeEnum.CASUAL, daysPerYear: 12, carryForwardMax: 0 },
      { name: 'Sick Leave', code: LeaveTypeEnum.SICK, daysPerYear: 10, carryForwardMax: 0 },
      {
        name: 'Earned / Privilege Leave',
        code: LeaveTypeEnum.EARNED,
        daysPerYear: 18,
        carryForwardMax: 10,
      },
      {
        name: 'Maternity Leave',
        code: LeaveTypeEnum.MATERNITY,
        daysPerYear: 182,
        carryForwardMax: 0,
      },
      {
        name: 'Paternity Leave',
        code: LeaveTypeEnum.PATERNITY,
        daysPerYear: 15,
        carryForwardMax: 0,
      },
      {
        name: 'Loss of Pay (Unpaid)',
        code: LeaveTypeEnum.UNPAID,
        daysPerYear: 0,
        carryForwardMax: 0,
      },
    ];

    for (const lt of leaveTypes) {
      await LeaveTypeModel.findOneAndUpdate({ code: lt.code }, lt, { upsert: true, new: true });
    }
    logger.info(' Seeded standard Leave Types');

    // 3. Seed Sample Departments
    const departmentsData = [
      { name: 'Human Resources', code: 'HR', description: 'Talent Acquisition & Employee Success' },
      {
        name: 'Engineering',
        code: 'ENG',
        description: 'Product Engineering and Core Infrastructure',
      },
      { name: 'Product & Design', code: 'PD', description: 'UI/UX and Product Roadmaps' },
      { name: 'Finance & Accounts', code: 'FIN', description: 'Financial Compliance and Payroll' },
    ];

    const departmentMap: Record<string, mongoose.Types.ObjectId> = {};
    for (const dept of departmentsData) {
      const doc = await DepartmentModel.findOneAndUpdate(
        { code: dept.code },
        { ...dept, isDeleted: false, isActive: true },
        { upsert: true, new: true },
      );
      departmentMap[dept.code] = doc._id;
    }
    logger.info(' Seeded sample Departments');

    // 4. Seed Sample Designations
    const designationsData = [
      { name: 'HR Director', code: 'HRD', departmentId: departmentMap['HR'], level: 4 },
      { name: 'HR Executive', code: 'HRE', departmentId: departmentMap['HR'], level: 1 },
      { name: 'Engineering Manager', code: 'EM', departmentId: departmentMap['ENG'], level: 4 },
      {
        name: 'Senior Software Engineer',
        code: 'SSE',
        departmentId: departmentMap['ENG'],
        level: 3,
      },
      { name: 'Software Engineer', code: 'SE', departmentId: departmentMap['ENG'], level: 2 },
      { name: 'Product Designer', code: 'PDES', departmentId: departmentMap['PD'], level: 2 },
    ];

    const designationMap: Record<string, mongoose.Types.ObjectId> = {};
    for (const desig of designationsData) {
      const doc = await DesignationModel.findOneAndUpdate(
        { code: desig.code },
        { ...desig, isDeleted: false, isActive: true },
        { upsert: true, new: true },
      );
      designationMap[desig.code] = doc._id;
    }
    logger.info(' Seeded sample Designations');

    // 5. Seed Sample Employees (HR Admin, Manager, Employees)
    const employeesData = [
      {
        employeeId: 'EMP001',
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'priya.hr@hrms.local',
        phone: '9876543210',
        dateOfBirth: '1990-05-14',
        gender: Gender.FEMALE,
        role: UserRole.HR_ADMIN,
        departmentCode: 'HR',
        designationCode: 'HRD',
        joiningDate: '2022-01-10',
        status: EmployeeStatus.ACTIVE,
        basicSalary: 60000,
      },
      {
        employeeId: 'EMP002',
        firstName: 'Rajesh',
        lastName: 'Kumar',
        email: 'rajesh.manager@hrms.local',
        phone: '9876543211',
        dateOfBirth: '1988-11-20',
        gender: Gender.MALE,
        role: UserRole.MANAGER,
        departmentCode: 'ENG',
        designationCode: 'EM',
        joiningDate: '2022-03-01',
        status: EmployeeStatus.ACTIVE,
        basicSalary: 80000,
      },
      {
        employeeId: 'EMP003',
        firstName: 'Anita',
        lastName: 'Singh',
        email: 'anita.dev@hrms.local',
        phone: '9876543212',
        dateOfBirth: '1995-08-25',
        gender: Gender.FEMALE,
        role: UserRole.EMPLOYEE,
        departmentCode: 'ENG',
        designationCode: 'SSE',
        joiningDate: '2023-06-15',
        status: EmployeeStatus.ACTIVE,
        basicSalary: 50000,
      },
    ];

    let managerEmpId: mongoose.Types.ObjectId | undefined;

    for (const empData of employeesData) {
      let emp = await EmployeeModel.findOne({ email: empData.email });
      if (!emp) {
        emp = await EmployeeModel.create({
          employeeId: empData.employeeId,
          firstName: empData.firstName,
          lastName: empData.lastName,
          email: empData.email,
          phone: empData.phone,
          dateOfBirth: empData.dateOfBirth,
          gender: empData.gender,
          role: empData.role,
          departmentId: departmentMap[empData.departmentCode],
          designationId: designationMap[empData.designationCode],
          joiningDate: empData.joiningDate,
          status: empData.status,
          reportingManagerId: empData.role === UserRole.EMPLOYEE ? managerEmpId : null,
          bankDetails: {
            accountHolderName: `${empData.firstName} ${empData.lastName}`,
            accountNumber: '123456789012',
            bankName: 'HDFC Bank',
            ifscCode: 'HDFC0001234',
            panNumber: 'ABCDE1234F',
            uanNumber: '100987654321',
          },
        });

        // Create matching User account with password "Password@123"
        const user = await UserModel.create({
          email: empData.email,
          password: 'Password@123',
          role: empData.role,
          employeeId: emp._id,
          isFirstLogin: false,
          isActive: true,
        });

        emp.userId = user._id;
        await emp.save();

        // Create Salary Structure
        await SalaryStructureModel.create({
          employeeId: emp._id,
          basic: empData.basicSalary,
          hra: empData.basicSalary * 0.5,
          conveyance: 1600,
          specialAllowance: empData.basicSalary * 0.2,
          medicalAllowance: 1250,
          pfApplicable: true,
          pfEmployeePercent: 12,
          pfEmployerPercent: 12,
          esiApplicable: false,
          professionalTax: 200,
          monthlyTds: 1500,
        });

        if (empData.role === UserRole.MANAGER) {
          managerEmpId = emp._id;
        }

        logger.info(
          ` Created user & employee: ${empData.email} (${empData.role}) [Password: Password@123]`,
        );
      }
    }

    // 6. Seed Sample Holidays
    const holidaysData = [
      { title: 'Republic Day', date: `${new Date().getFullYear()}-01-26`, isOptional: false },
      { title: 'Holi Festival', date: `${new Date().getFullYear()}-03-25`, isOptional: false },
      { title: 'Independence Day', date: `${new Date().getFullYear()}-08-15`, isOptional: false },
      { title: 'Gandhi Jayanti', date: `${new Date().getFullYear()}-10-02`, isOptional: false },
      { title: 'Diwali Festival', date: `${new Date().getFullYear()}-11-01`, isOptional: false },
      { title: 'Christmas Day', date: `${new Date().getFullYear()}-12-25`, isOptional: false },
    ];

    for (const h of holidaysData) {
      await HolidayModel.findOneAndUpdate({ date: h.date }, h, { upsert: true, new: true });
    }
    logger.info(' Seeded sample Holidays');

    logger.info('🎉 HRMS database seeding completed successfully!');
  } catch (error) {
    logger.error('❌ Database seeding failed:', error);
  } finally {
    await disconnectDatabase();
  }
};

// If run directly
if (require.main === module) {
  seedDatabase().then(() => process.exit(0));
}

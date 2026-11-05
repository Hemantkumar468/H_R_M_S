import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  UpdateEmployeeStatusDto,
  EmployeeStatus,
  PaginationQueryParams,
} from '@hrms/shared';
import { EmployeeModel, IEmployeeDocument } from '../models/Employee';
import { UserModel } from '../models/User';
import { SalaryStructureModel } from '../models/SalaryStructure';
import { AppError } from '../utils/appError';

export class EmployeeService {
  private static async generateNextEmployeeId(): Promise<string> {
    const lastEmployee = await EmployeeModel.findOne({}, {}, { sort: { createdAt: -1 } });
    if (!lastEmployee || !lastEmployee.employeeId) {
      return 'EMP001';
    }

    const matches = lastEmployee.employeeId.match(/\d+$/);
    if (!matches) {
      return 'EMP001';
    }

    const nextNum = parseInt(matches[0], 10) + 1;
    return `EMP${nextNum.toString().padStart(3, '0')}`;
  }

  static async createEmployee(data: CreateEmployeeDto) {
    const existing = await EmployeeModel.findOne({
      email: data.email.toLowerCase(),
      isDeleted: false,
    });
    if (existing) {
      throw AppError.conflict(`Employee with email ${data.email} already exists`);
    }

    const employeeId = await this.generateNextEmployeeId();

    // 1. Create employee document
    const employee = await EmployeeModel.create({
      ...data,
      employeeId,
      email: data.email.toLowerCase(),
    });

    // 2. Automatically create matching User login account
    const defaultPassword = 'Welcome@12345';
    const user = await UserModel.create({
      email: data.email.toLowerCase(),
      password: defaultPassword,
      role: data.role,
      employeeId: employee._id,
      isFirstLogin: true,
      isActive: true,
    });

    employee.userId = user._id;
    await employee.save();

    // 3. Initialize default salary structure template for the new employee
    await SalaryStructureModel.create({
      employeeId: employee._id,
      basic: 25000,
      hra: 12500,
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

    return employee;
  }

  static async listEmployees(
    params: PaginationQueryParams & {
      departmentId?: string;
      designationId?: string;
      status?: EmployeeStatus;
    },
  ) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const { search, sortBy, sortOrder, departmentId, designationId, status } = params;
    const query: Record<string, unknown> = { isDeleted: false };

    if (departmentId) query.departmentId = departmentId;
    if (designationId) query.designationId = designationId;
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortField = sortBy || 'createdAt';
    const sortDir = sortOrder === 'asc' ? 1 : -1;

    const [employees, total] = await Promise.all([
      EmployeeModel.find(query)
        .populate('departmentId', 'name code')
        .populate('designationId', 'name code level')
        .populate('reportingManagerId', 'firstName lastName employeeId')
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit)
        .lean(),
      EmployeeModel.countDocuments(query),
    ]);

    return {
      employees,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  static async getEmployeeById(id: string): Promise<IEmployeeDocument> {
    const employee = await EmployeeModel.findOne({ _id: id, isDeleted: false })
      .populate('departmentId', 'name code')
      .populate('designationId', 'name code level')
      .populate('reportingManagerId', 'firstName lastName employeeId email');

    if (!employee) {
      throw AppError.notFound('Employee not found');
    }
    return employee;
  }

  static async updateEmployee(id: string, data: UpdateEmployeeDto) {
    if (data.email) {
      const existing = await EmployeeModel.findOne({
        email: data.email.toLowerCase(),
        _id: { $ne: id },
        isDeleted: false,
      });
      if (existing) {
        throw AppError.conflict(`Employee with email ${data.email} already exists`);
      }
    }

    const employee = await EmployeeModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { ...data, ...(data.email && { email: data.email.toLowerCase() }) },
      { new: true, runValidators: true },
    )
      .populate('departmentId', 'name code')
      .populate('designationId', 'name code level')
      .populate('reportingManagerId', 'firstName lastName employeeId');

    if (!employee) {
      throw AppError.notFound('Employee not found');
    }

    // Sync role with User model if role changed
    if (data.role && employee.userId) {
      await UserModel.findByIdAndUpdate(employee.userId, { role: data.role });
    }

    return employee;
  }

  static async updateStatus(id: string, dto: UpdateEmployeeStatusDto) {
    const employee = await EmployeeModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { status: dto.status },
      { new: true },
    );

    if (!employee) {
      throw AppError.notFound('Employee not found');
    }

    // If employee is EXITED, deactivate user account
    if (dto.status === EmployeeStatus.EXITED && employee.userId) {
      await UserModel.findByIdAndUpdate(employee.userId, { isActive: false, refreshTokens: [] });
    }

    return employee;
  }

  static async addDocument(
    employeeId: string,
    docData: { name: string; documentType: string; fileUrl: string },
  ) {
    const employee = await EmployeeModel.findOne({ _id: employeeId, isDeleted: false });
    if (!employee) {
      throw AppError.notFound('Employee not found');
    }

    employee.documents.push({
      ...docData,
      uploadedAt: new Date(),
    });

    await employee.save();
    return employee;
  }

  static async deleteDocument(employeeId: string, documentId: string) {
    const employee = await EmployeeModel.findOne({ _id: employeeId, isDeleted: false });
    if (!employee) {
      throw AppError.notFound('Employee not found');
    }

    employee.documents = employee.documents.filter((doc) => doc._id?.toString() !== documentId);

    await employee.save();
    return employee;
  }

  static async deleteEmployee(id: string) {
    const employee = await EmployeeModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true, status: EmployeeStatus.EXITED },
      { new: true },
    );

    if (!employee) {
      throw AppError.notFound('Employee not found');
    }

    if (employee.userId) {
      await UserModel.findByIdAndUpdate(employee.userId, { isActive: false, refreshTokens: [] });
    }

    return employee;
  }
}

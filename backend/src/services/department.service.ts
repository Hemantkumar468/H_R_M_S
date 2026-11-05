import { CreateDepartmentDto, UpdateDepartmentDto, PaginationQueryParams } from '@hrms/shared';
import { DepartmentModel } from '../models/Department';
import { EmployeeModel } from '../models/Employee';
import { AppError } from '../utils/appError';

export class DepartmentService {
  static async createDepartment(data: CreateDepartmentDto) {
    const existing = await DepartmentModel.findOne({
      code: data.code.toUpperCase(),
      isDeleted: false,
    });
    if (existing) {
      throw AppError.conflict(`Department code ${data.code} already exists`);
    }

    const dept = await DepartmentModel.create({
      ...data,
      code: data.code.toUpperCase(),
    });
    return dept;
  }

  static async listDepartments(params: PaginationQueryParams) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const { search, sortBy, sortOrder } = params;
    const query: Record<string, unknown> = { isDeleted: false };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortField = sortBy || 'createdAt';
    const sortDir = sortOrder === 'asc' ? 1 : -1;

    const [departments, total] = await Promise.all([
      DepartmentModel.find(query)
        .populate('headId', 'firstName lastName email')
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit)
        .lean(),
      DepartmentModel.countDocuments(query),
    ]);

    // Attach active employee count for each department
    const enriched = await Promise.all(
      departments.map(async (d) => {
        const count = await EmployeeModel.countDocuments({
          departmentId: d._id,
          isDeleted: false,
        });
        return { ...d, employeeCount: count };
      }),
    );

    return {
      departments: enriched,
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

  static async getDepartmentById(id: string) {
    const dept = await DepartmentModel.findOne({ _id: id, isDeleted: false }).populate(
      'headId',
      'firstName lastName email',
    );
    if (!dept) {
      throw AppError.notFound('Department not found');
    }
    return dept;
  }

  static async updateDepartment(id: string, data: UpdateDepartmentDto) {
    if (data.code) {
      const existing = await DepartmentModel.findOne({
        code: data.code.toUpperCase(),
        _id: { $ne: id },
        isDeleted: false,
      });
      if (existing) {
        throw AppError.conflict(`Department code ${data.code} already exists`);
      }
    }

    const dept = await DepartmentModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { ...data, ...(data.code && { code: data.code.toUpperCase() }) },
      { new: true, runValidators: true },
    );

    if (!dept) {
      throw AppError.notFound('Department not found');
    }
    return dept;
  }

  static async deleteDepartment(id: string) {
    // Check if employees are assigned
    const count = await EmployeeModel.countDocuments({ departmentId: id, isDeleted: false });
    if (count > 0) {
      throw AppError.badRequest(
        `Cannot delete department: ${count} active employees are assigned to it. Reassign them first.`,
      );
    }

    const dept = await DepartmentModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true, isActive: false },
      { new: true },
    );

    if (!dept) {
      throw AppError.notFound('Department not found');
    }
    return dept;
  }
}

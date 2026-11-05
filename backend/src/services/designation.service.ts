import { CreateDesignationDto, UpdateDesignationDto, PaginationQueryParams } from '@hrms/shared';
import { DesignationModel } from '../models/Designation';
import { EmployeeModel } from '../models/Employee';
import { AppError } from '../utils/appError';

export class DesignationService {
  static async createDesignation(data: CreateDesignationDto) {
    const existing = await DesignationModel.findOne({
      code: data.code.toUpperCase(),
      isDeleted: false,
    });
    if (existing) {
      throw AppError.conflict(`Designation code ${data.code} already exists`);
    }

    const designation = await DesignationModel.create({
      ...data,
      code: data.code.toUpperCase(),
    });
    return designation;
  }

  static async listDesignations(params: PaginationQueryParams & { departmentId?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const { search, sortBy, sortOrder, departmentId } = params;
    const query: Record<string, unknown> = { isDeleted: false };

    if (departmentId) {
      query.departmentId = departmentId;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortField = sortBy || 'createdAt';
    const sortDir = sortOrder === 'asc' ? 1 : -1;

    const [designations, total] = await Promise.all([
      DesignationModel.find(query)
        .populate('departmentId', 'name code')
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit)
        .lean(),
      DesignationModel.countDocuments(query),
    ]);

    // Attach active employee count
    const enriched = await Promise.all(
      designations.map(async (d) => {
        const count = await EmployeeModel.countDocuments({
          designationId: d._id,
          isDeleted: false,
        });
        return { ...d, employeeCount: count };
      }),
    );

    return {
      designations: enriched,
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

  static async getDesignationById(id: string) {
    const desig = await DesignationModel.findOne({ _id: id, isDeleted: false }).populate(
      'departmentId',
      'name code',
    );
    if (!desig) {
      throw AppError.notFound('Designation not found');
    }
    return desig;
  }

  static async updateDesignation(id: string, data: UpdateDesignationDto) {
    if (data.code) {
      const existing = await DesignationModel.findOne({
        code: data.code.toUpperCase(),
        _id: { $ne: id },
        isDeleted: false,
      });
      if (existing) {
        throw AppError.conflict(`Designation code ${data.code} already exists`);
      }
    }

    const desig = await DesignationModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { ...data, ...(data.code && { code: data.code.toUpperCase() }) },
      { new: true, runValidators: true },
    );

    if (!desig) {
      throw AppError.notFound('Designation not found');
    }
    return desig;
  }

  static async deleteDesignation(id: string) {
    const count = await EmployeeModel.countDocuments({ designationId: id, isDeleted: false });
    if (count > 0) {
      throw AppError.badRequest(
        `Cannot delete designation: ${count} active employees are assigned to it. Reassign them first.`,
      );
    }

    const desig = await DesignationModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true, isActive: false },
      { new: true },
    );

    if (!desig) {
      throw AppError.notFound('Designation not found');
    }
    return desig;
  }
}

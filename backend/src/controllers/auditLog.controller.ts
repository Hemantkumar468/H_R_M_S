import { Request, Response } from 'express';
import { PaginationQuerySchema, AuditAction } from '@hrms/shared';
import { AuditLogModel } from '../models/AuditLog';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';

export class AuditLogController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    const params = PaginationQuerySchema.parse(req.query);
    const { page, limit, search, sortBy, sortOrder } = params;

    const action = req.query.action as AuditAction | undefined;
    const entity = req.query.entity as string | undefined;

    const query: Record<string, unknown> = {};
    if (action) query.action = action;
    if (entity) query.entity = entity;
    if (search) {
      query.$or = [
        { userEmail: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } },
        { entityId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortField = sortBy || 'createdAt';
    const sortDir = sortOrder === 'asc' ? 1 : -1;

    const [logs, total] = await Promise.all([
      AuditLogModel.find(query)
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLogModel.countDocuments(query),
    ]);

    return sendSuccess(res, 'Audit logs retrieved successfully', logs, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    });
  });
}

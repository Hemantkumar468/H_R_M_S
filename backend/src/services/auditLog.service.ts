import { Request } from 'express';
import { AuditAction, UserRole } from '@hrms/shared';
import { AuditLogModel } from '../models/AuditLog';
import { logger } from '../config/logger';

export interface RecordAuditLogParams {
  userId: string;
  userEmail: string;
  userRole: UserRole;
  action: AuditAction;
  entity: string;
  entityId?: string;
  details: string;
  diff?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  req?: Request;
}

export const recordAuditLog = async (params: RecordAuditLogParams): Promise<void> => {
  try {
    const ipAddress = params.req?.ip || params.req?.socket?.remoteAddress || 'unknown';
    const userAgent = params.req?.headers['user-agent'] || 'unknown';

    await AuditLogModel.create({
      userId: params.userId,
      userEmail: params.userEmail,
      userRole: params.userRole,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      details: params.details,
      diff: params.diff,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    logger.error('Failed to write audit log:', error);
  }
};

import mongoose, { Document, Schema, Model } from 'mongoose';
import { AuditAction, UserRole } from '@hrms/shared';

export interface IAuditLogDocument extends Document {
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
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
      index: true,
    },
    userRole: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: true,
      index: true,
    },
    entity: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      index: true,
    },
    details: {
      type: String,
      required: true,
    },
    diff: {
      before: { type: Schema.Types.Mixed },
      after: { type: Schema.Types.Mixed },
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

AuditLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 });

export const AuditLogModel: Model<IAuditLogDocument> = mongoose.model<IAuditLogDocument>(
  'AuditLog',
  AuditLogSchema,
);

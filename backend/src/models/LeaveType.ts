import mongoose, { Document, Schema, Model } from 'mongoose';
import { LeaveTypeEnum } from '@hrms/shared';

export interface ILeaveTypeDocument extends Document {
  name: string;
  code: LeaveTypeEnum;
  daysPerYear: number;
  carryForwardMax: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveTypeSchema = new Schema<ILeaveTypeDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      enum: Object.values(LeaveTypeEnum),
      required: true,
      unique: true,
      index: true,
    },
    daysPerYear: {
      type: Number,
      required: true,
      min: 0,
    },
    carryForwardMax: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export const LeaveTypeModel: Model<ILeaveTypeDocument> = mongoose.model<ILeaveTypeDocument>(
  'LeaveType',
  LeaveTypeSchema,
);

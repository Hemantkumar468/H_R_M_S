import mongoose, { Document, Schema, Model } from 'mongoose';
import { LeaveStatus } from '@hrms/shared';

export interface ILeaveRequestDocument extends Document {
  employeeId: mongoose.Types.ObjectId;
  leaveTypeId: mongoose.Types.ObjectId;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysCount: number;
  reason: string;
  status: LeaveStatus;
  managerComment?: string;
  approvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveRequestSchema = new Schema<ILeaveRequestDocument>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    leaveTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'LeaveType',
      required: true,
      index: true,
    },
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
    daysCount: {
      type: Number,
      required: true,
      min: 0.5,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(LeaveStatus),
      default: LeaveStatus.PENDING,
      index: true,
    },
    managerComment: {
      type: String,
      trim: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export const LeaveRequestModel: Model<ILeaveRequestDocument> =
  mongoose.model<ILeaveRequestDocument>('LeaveRequest', LeaveRequestSchema);

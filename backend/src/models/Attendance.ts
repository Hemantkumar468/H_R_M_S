import mongoose, { Document, Schema, Model } from 'mongoose';
import { AttendanceStatus, RegularizationStatus } from '@hrms/shared';

export interface IAttendanceDocument extends Document {
  employeeId: mongoose.Types.ObjectId;
  date: string; // Format: YYYY-MM-DD
  checkIn?: Date;
  checkOut?: Date;
  workingHours?: number;
  isLate: boolean;
  isEarlyLeave: boolean;
  overtimeHours: number;
  status: AttendanceStatus;
  location?: {
    checkInLatitude?: number;
    checkInLongitude?: number;
    checkInLocation?: string;
    checkOutLatitude?: number;
    checkOutLongitude?: number;
    checkOutLocation?: string;
  };
  regularizationStatus: RegularizationStatus;
  regularizationReason?: string;
  requestedCheckIn?: Date;
  requestedCheckOut?: Date;
  regularizationManagerComment?: string;
  regularizationResolvedBy?: mongoose.Types.ObjectId;
  regularizationResolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendanceDocument>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    checkIn: {
      type: Date,
      default: null,
    },
    checkOut: {
      type: Date,
      default: null,
    },
    workingHours: {
      type: Number,
      default: 0,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    isEarlyLeave: {
      type: Boolean,
      default: false,
    },
    overtimeHours: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(AttendanceStatus),
      default: AttendanceStatus.ABSENT,
      index: true,
    },
    location: {
      checkInLatitude: Number,
      checkInLongitude: Number,
      checkInLocation: String,
      checkOutLatitude: Number,
      checkOutLongitude: Number,
      checkOutLocation: String,
    },
    regularizationStatus: {
      type: String,
      enum: Object.values(RegularizationStatus),
      default: RegularizationStatus.NONE,
      index: true,
    },
    regularizationReason: {
      type: String,
      trim: true,
    },
    requestedCheckIn: {
      type: Date,
    },
    requestedCheckOut: {
      type: Date,
    },
    regularizationManagerComment: {
      type: String,
      trim: true,
    },
    regularizationResolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    regularizationResolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export const AttendanceModel: Model<IAttendanceDocument> = mongoose.model<IAttendanceDocument>(
  'Attendance',
  AttendanceSchema,
);

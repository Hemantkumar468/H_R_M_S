import mongoose, { Document, Schema, Model } from 'mongoose';
import { PayrollStatus } from '@hrms/shared';

export interface IPayrollItemDocument extends Document {
  employeeId: mongoose.Types.ObjectId;
  month: number;
  year: number;
  totalWorkingDays: number;
  presentDays: number;
  paidLeaves: number;
  payableDays: number;

  earnings: {
    basic: number;
    hra: number;
    conveyance: number;
    specialAllowance: number;
    medicalAllowance: number;
    grossEarnings: number;
  };

  deductions: {
    pfEmployee: number;
    pfEmployer: number;
    esiEmployee: number;
    esiEmployer: number;
    professionalTax: number;
    tds: number;
    totalDeductions: number;
  };

  netSalary: number;
  status: PayrollStatus;
  payslipPdfPath?: string;
  paidAt?: Date;
  processedBy?: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const PayrollItemSchema = new Schema<IPayrollItemDocument>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
      index: true,
    },
    year: {
      type: Number,
      required: true,
      index: true,
    },
    totalWorkingDays: {
      type: Number,
      required: true,
      default: 30,
    },
    presentDays: {
      type: Number,
      required: true,
      default: 0,
    },
    paidLeaves: {
      type: Number,
      default: 0,
    },
    payableDays: {
      type: Number,
      required: true,
      default: 0,
    },
    earnings: {
      basic: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      conveyance: { type: Number, default: 0 },
      specialAllowance: { type: Number, default: 0 },
      medicalAllowance: { type: Number, default: 0 },
      grossEarnings: { type: Number, default: 0 },
    },
    deductions: {
      pfEmployee: { type: Number, default: 0 },
      pfEmployer: { type: Number, default: 0 },
      esiEmployee: { type: Number, default: 0 },
      esiEmployer: { type: Number, default: 0 },
      professionalTax: { type: Number, default: 0 },
      tds: { type: Number, default: 0 },
      totalDeductions: { type: Number, default: 0 },
    },
    netSalary: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(PayrollStatus),
      default: PayrollStatus.DRAFT,
      index: true,
    },
    payslipPdfPath: {
      type: String,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

PayrollItemSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

export const PayrollItemModel: Model<IPayrollItemDocument> = mongoose.model<IPayrollItemDocument>(
  'PayrollItem',
  PayrollItemSchema,
);

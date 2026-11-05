import mongoose, { Document, Schema, Model } from 'mongoose';
import { EmployeeStatus, Gender, UserRole } from '@hrms/shared';

export interface IEmployeeDocument extends Document {
  employeeId: string;
  userId?: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: Gender;
  bloodGroup?: string;
  address?: string;
  avatarUrl?: string;

  departmentId: mongoose.Types.ObjectId;
  designationId: mongoose.Types.ObjectId;
  role: UserRole;
  reportingManagerId?: mongoose.Types.ObjectId;
  joiningDate: string;
  status: EmployeeStatus;
  probationEndDate?: string;

  bankDetails?: {
    accountHolderName?: string;
    accountNumber?: string;
    bankName?: string;
    ifscCode?: string;
    panNumber?: string;
    uanNumber?: string;
  };

  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };

  documents: Array<{
    _id?: mongoose.Types.ObjectId;
    name: string;
    documentType: string;
    fileUrl: string;
    uploadedAt: Date;
  }>;

  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployeeDocument>(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: Object.values(Gender),
      required: true,
    },
    bloodGroup: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    designationId: {
      type: Schema.Types.ObjectId,
      ref: 'Designation',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.EMPLOYEE,
      index: true,
    },
    reportingManagerId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      index: true,
    },
    joiningDate: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(EmployeeStatus),
      default: EmployeeStatus.PROBATION,
      index: true,
    },
    probationEndDate: {
      type: String,
      default: null,
    },
    bankDetails: {
      accountHolderName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      bankName: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      panNumber: { type: String, default: '' },
      uanNumber: { type: String, default: '' },
    },
    emergencyContact: {
      name: { type: String, default: '' },
      relationship: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
    documents: [
      {
        name: { type: String, required: true },
        documentType: { type: String, required: true },
        fileUrl: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

EmployeeSchema.index({ firstName: 'text', lastName: 'text', email: 'text', employeeId: 'text' });

export const EmployeeModel: Model<IEmployeeDocument> = mongoose.model<IEmployeeDocument>(
  'Employee',
  EmployeeSchema,
);

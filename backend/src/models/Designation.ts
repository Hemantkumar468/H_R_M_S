import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IDesignationDocument extends Document {
  name: string;
  code: string;
  departmentId: mongoose.Types.ObjectId;
  level: number;
  description?: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DesignationSchema = new Schema<IDesignationDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
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

export const DesignationModel: Model<IDesignationDocument> = mongoose.model<IDesignationDocument>(
  'Designation',
  DesignationSchema,
);

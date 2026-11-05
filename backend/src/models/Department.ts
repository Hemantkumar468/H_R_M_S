import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IDepartmentDocument extends Document {
  name: string;
  code: string;
  description?: string;
  headId?: mongoose.Types.ObjectId;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartmentDocument>(
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
    description: {
      type: String,
      trim: true,
    },
    headId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
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

export const DepartmentModel: Model<IDepartmentDocument> = mongoose.model<IDepartmentDocument>(
  'Department',
  DepartmentSchema,
);

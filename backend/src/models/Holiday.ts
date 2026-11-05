import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IHolidayDocument extends Document {
  title: string;
  date: string; // YYYY-MM-DD
  description?: string;
  isOptional: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HolidaySchema = new Schema<IHolidayDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isOptional: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const HolidayModel: Model<IHolidayDocument> = mongoose.model<IHolidayDocument>(
  'Holiday',
  HolidaySchema,
);

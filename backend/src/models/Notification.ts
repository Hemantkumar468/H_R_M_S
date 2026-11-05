import mongoose, { Document, Schema, Model } from 'mongoose';
import { NotificationType } from '@hrms/shared';

export interface INotificationDocument extends Document {
  user: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      default: NotificationType.GENERAL,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export const NotificationModel: Model<INotificationDocument> =
  mongoose.model<INotificationDocument>('Notification', NotificationSchema);

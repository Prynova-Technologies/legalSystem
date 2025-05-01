import mongoose, { Schema } from 'mongoose';
import { 
  IMessageDocument, 
  INotificationDocument,
  MessageType, 
  MessageStatus 
} from '../interfaces/communication.interface';

// Message Attachment Schema
const messageAttachmentSchema = new Schema(
  {
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

// Message Read Receipt Schema
const messageReadSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

// Message Schema
const messageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
    },
    recipients: [
      {
        type: Schema.Types.ObjectId,
        refPath: 'recipientModel',
        required: [true, 'At least one recipient is required'],
      },
    ],
    recipientModel: {
      type: String,
      required: true,
      enum: ['User', 'Client'],
      default: 'User',
    },
    subject: String,
    content: {
      type: String,
      required: [true, 'Message content is required'],
    },
    messageType: {
      type: String,
      enum: Object.values(MessageType),
      default: MessageType.INTERNAL,
    },
    status: {
      type: String,
      enum: Object.values(MessageStatus),
      default: MessageStatus.SENT,
    },
    case: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
    },
    attachments: [messageAttachmentSchema],
    parentMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    readBy: [messageReadSchema],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Message Methods
messageSchema.methods.markAsRead = function (userId: string): void {
  // Check if already read by this user
  const alreadyRead = this.readBy.some((read: any) => read.user.toString() === userId);
  
  if (!alreadyRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date(),
    });
    this.save();
  }
};

messageSchema.methods.addAttachment = function (attachment: any): void {
  this.attachments.push({
    ...attachment,
    uploadedAt: new Date(),
  });
  this.save();
};

// Message Virtuals
messageSchema.virtual('isRead').get(function () {
  return this.readBy.length > 0;
});

messageSchema.virtual('replies', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'parentMessage',
});

// Message Indexes
messageSchema.index({ sender: 1 });
messageSchema.index({ recipients: 1 });
messageSchema.index({ case: 1 });
messageSchema.index({ messageType: 1 });
messageSchema.index({ parentMessage: 1 });

// Notification Schema
const notificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
    },
    type: {
      type: String,
      enum: ['task', 'case', 'document', 'message', 'billing', 'system'],
      required: [true, 'Notification type is required'],
    },
    relatedId: Schema.Types.ObjectId,
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
  },
  {
    timestamps: true,
  }
);

// Notification Methods
notificationSchema.methods.markAsRead = function (): void {
  this.isRead = true;
  this.readAt = new Date();
  this.save();
};

// Notification Indexes
notificationSchema.index({ user: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });

// Create models
const Message = mongoose.model<IMessageDocument>('Message', messageSchema);
const Notification = mongoose.model<INotificationDocument>('Notification', notificationSchema);

export { Message, Notification };
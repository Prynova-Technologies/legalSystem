import { Document } from 'mongoose';
import { IUserDocument } from './user.interface';
import { ICaseDocument } from './case.interface';
import { IClientDocument } from './client.interface';

export enum MessageType {
  INTERNAL = 'internal',
  CLIENT = 'client',
  SMS = 'sms',
  EMAIL = 'email'
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}

export interface IMessageAttachment {
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  uploadedAt: Date;
}

export interface IMessage {
  sender: string | IUserDocument;
  recipients: (string | IUserDocument | IClientDocument)[];
  subject?: string;
  content: string;
  messageType: MessageType;
  status: MessageStatus;
  case?: string | ICaseDocument;
  attachments?: IMessageAttachment[];
  parentMessage?: string; // For threaded conversations
  readBy: {
    user: string | IUserDocument;
    readAt: Date;
  }[];
  isDeleted: boolean;
}

export interface IMessageDocument extends IMessage, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  markAsRead(userId: string): void;
  addAttachment(attachment: Omit<IMessageAttachment, 'uploadedAt'>): void;
}

export interface INotification {
  user: string | IUserDocument;
  title: string;
  message: string;
  type: 'task' | 'case' | 'document' | 'message' | 'billing' | 'system';
  relatedId?: string; // ID of related entity (task, case, etc.)
  isRead: boolean;
  readAt?: Date;
}

export interface INotificationDocument extends INotification, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  markAsRead(): void;
}
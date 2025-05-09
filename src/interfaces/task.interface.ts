import { Document } from 'mongoose';
import { IUserDocument } from './user.interface';
import { ICaseDocument } from './case.interface';

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface ITaskReminder {
  reminderDate: Date;
  sent: boolean;
  sentAt?: Date;
}

export interface ITask {
  title: string;
  description: string;
  case?: string | ICaseDocument;
  assignedTo: string[] | IUserDocument[];
  assignedBy: string | IUserDocument;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: Date;
  completedDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  billable: boolean;
  reminders: ITaskReminder[];
  notes?: string;
  tags?: string[];
  isDeleted: boolean;
}

export interface ITaskDocument extends ITask, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  addReminder(reminderDate: Date): void;
  markReminderSent(reminderId: string): boolean;
  isOverdue(): boolean;
}
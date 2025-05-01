import { Document, Model } from 'mongoose';
import { IUserDocument } from './user.interface';
import { ICaseDocument } from './case.interface';
import { ITaskDocument } from './task.interface';

export interface ITimeEntry {
  user: string | IUserDocument;
  case?: string | ICaseDocument;
  task?: string | ITaskDocument;
  description: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // Duration in minutes
  billable: boolean;
  billingRate?: number; // Hourly rate
  billableAmount?: number; // Calculated amount
  invoiced: boolean;
  invoice?: string; // Reference to invoice
  notes?: string;
  tags?: string[];
  isDeleted: boolean;
}

export interface ITimeEntryDocument extends ITimeEntry, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  calculateBillableAmount(): number;
  markAsInvoiced(invoiceId: string): void;
}

export interface ITimeEntryModel extends Model<ITimeEntryDocument> {
  getTotalHoursByUser(userId: string, startDate: Date, endDate: Date): Promise<number>;
  getTotalHoursByCase(caseId: string): Promise<number>;
  getUnbilledEntries(): Promise<ITimeEntryDocument[]>;
  find(filter?: any): any;
}
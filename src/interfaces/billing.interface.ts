import { Document, Model } from 'mongoose';
import { IUserDocument } from './user.interface';
import { IClientDocument } from './client.interface';
import { ICaseDocument } from './case.interface';
import { ITimeEntryDocument } from './timeEntry.interface';

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  PARTIALLY_PAID = 'partially_paid'
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  BANK_TRANSFER = 'bank_transfer',
  CHECK = 'check',
  CASH = 'cash',
  OTHER = 'other'
}

export interface IInvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  timeEntry?: string | ITimeEntryDocument;
  case?: string | ICaseDocument;
  taxable: boolean;
  notes?: string;
}

export interface IInvoicePayment {
  amount: number;
  date: Date;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  recordedBy: string | IUserDocument;
}

export interface IInvoice {
  invoiceNumber: string;
  client: string | IClientDocument;
  case?: string | ICaseDocument;
  issueDate: Date;
  dueDate: Date;
  items: IInvoiceItem[];
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  total: number;
  status: InvoiceStatus;
  payments: IInvoicePayment[];
  amountPaid: number;
  balance: number;
  notes?: string;
  terms?: string;
  isDeleted: boolean;
}

export interface IInvoiceDocument extends IInvoice, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  addPayment(payment: Omit<IInvoicePayment, 'recordedBy'>, userId: string): void;
  calculateBalance(): number;
  updateStatus(): InvoiceStatus;
}

export interface IInvoiceModel extends Model<IInvoiceDocument> {
  generateInvoiceNumber(): Promise<string>;
  getOverdueInvoices(): Promise<IInvoiceDocument[]>;
  getTotalRevenue(startDate: Date, endDate: Date): Promise<number>;
}
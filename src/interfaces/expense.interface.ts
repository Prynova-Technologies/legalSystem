import { Document, Model } from 'mongoose';
import { IUserDocument } from './user.interface';
import { ICaseDocument } from './case.interface';
import { IClientDocument } from './client.interface';

export enum ExpenseCategory {
  TRAVEL = 'travel',
  MEALS = 'meals',
  LODGING = 'lodging',
  OFFICE_SUPPLIES = 'office_supplies',
  FILING_FEES = 'filing_fees',
  EXPERT_FEES = 'expert_fees',
  COURT_COSTS = 'court_costs',
  RESEARCH = 'research',
  POSTAGE = 'postage',
  PRINTING = 'printing',
  OTHER = 'other'
}

export enum ExpenseStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REIMBURSED = 'reimbursed',
  BILLED = 'billed'
}

export interface IExpense {
  description: string;
  amount: number;
  date: Date;
  category: ExpenseCategory;
  billable: boolean;
  billableAmount?: number;
  receiptUrl?: string;
  notes?: string;
  status: ExpenseStatus;
  case?: string | ICaseDocument;
  client?: string | IClientDocument;
  submittedBy: string | IUserDocument;
  approvedBy?: string | IUserDocument;
  invoice?: string;
  invoiced: boolean;
  isDeleted: boolean;
  isApproved?: boolean;
}

export interface IExpenseDocument extends IExpense, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  markAsBilled(invoiceId: string): void;
  calculateBillableAmount(markupPercentage?: number): number;
}

export interface IExpenseModel extends Model<IExpenseDocument> {
  getUnbilledExpenses(): Promise<IExpenseDocument[]>;
  getTotalExpensesByCase(caseId: string): Promise<number>;
  getTotalExpensesByCategory(startDate: Date, endDate: Date): Promise<Record<string, number>>;
}
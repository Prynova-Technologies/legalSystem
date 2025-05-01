import { Document, Model } from 'mongoose';
import { IUserDocument } from './user.interface';
import { IClientDocument } from './client.interface';

export enum CaseStatus {
  OPEN = 'open',
  PENDING = 'pending',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
  SUSPENDED = 'suspended'
}

export enum CaseType {
  CIVIL = 'civil',
  CRIMINAL = 'criminal',
  FAMILY = 'family',
  CORPORATE = 'corporate',
  REAL_ESTATE = 'real_estate',
  INTELLECTUAL_PROPERTY = 'intellectual_property',
  IMMIGRATION = 'immigration',
  TAX = 'tax',
  BANKRUPTCY = 'bankruptcy',
  OTHER = 'other'
}

export interface ICaseParty {
  _id: { toString(): string };
  name: string;
  type: 'plaintiff' | 'defendant' | 'witness' | 'expert' | 'other';
  contact?: string;
  email?: string;
  notes?: string;
}

export interface ICaseActivity {
  action: string;
  description: string;
  performedBy: string | IUserDocument;
  timestamp: Date;
}

export interface ICase {
  caseNumber: string;
  title: string;
  description: string;
  type: CaseType;
  status: CaseStatus;
  client: string | IClientDocument;
  assignedAttorneys: (string | IUserDocument)[];
  assignedParalegals?: (string | IUserDocument)[];
  parties: ICaseParty[];
  courtDetails?: {
    court: string;
    judge?: string;
    jurisdiction?: string;
    caseNumber?: string;
    filingDate?: Date;
  };
  openDate: Date;
  closeDate?: Date;
  activityLog: ICaseActivity[];
  notes?: string;
  tags?: string[];
  isDeleted: boolean;
}

export interface ICaseDocument extends ICase, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  addActivity(action: string, description: string, userId: string): void;
}

export interface ICaseModel extends Model<ICaseDocument> {
  generateCaseNumber(): Promise<string>;
}
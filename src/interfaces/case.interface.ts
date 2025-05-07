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

export interface IAssignedAttorney {
  attorney: string | IUserDocument;
  isPrimary: boolean;
}

export interface ICase {
  caseNumber: string;
  title: string;
  description: string;
  type: CaseType;
  status: CaseStatus;
  client: string | IClientDocument;
  clientRole: 'plaintiff' | 'defendant';
  assignedAttorneys: IAssignedAttorney[];
  assignedParalegals?: (string | IUserDocument)[];
  parties: ICaseParty[];
  courtDetails?: {
    court: string;
    judge?: string;
    jurisdiction?: string;
    caseNumber?: string;
    filingDate?: Date;
  };
  isOpen: boolean;
  openDate: Date;
  closeDate?: Date;
  tags?: string[];
  isDeleted: boolean;
}

export interface ICaseDocument extends ICase, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  addActivity(action: string, description: string, userId: string): Promise<void>;
  
  // Related collections that can be attached to a case object
  notes?: Array<import('../models/note.model').INote>;
  activities?: Array<import('../models/activity.model').IActivity>;
  tasks?: Array<import('./task.interface').ITaskDocument>;
  documents?: Array<import('./document.interface').IDocumentDocument>;
}

export interface ICaseModel extends Model<ICaseDocument> {
  generateCaseNumber(): Promise<string>;
}
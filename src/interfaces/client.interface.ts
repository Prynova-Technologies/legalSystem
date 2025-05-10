import { Document, Model } from 'mongoose';
import { IUserDocument } from './user.interface';

export interface IClientContact {
  _id: string;
  type: 'phone' | 'email' | 'address' | 'other';
  value: string;
  isPrimary?: boolean;
  notes?: string;
}

export interface IAddress {
  street: string;
  city: string;
  country: string;
  postalCode: string;
}

export interface IClientDocument {
  name: string;
  contactInfo: string;
  notes?: string;
}

export interface IClient {
  firstName: string;
  lastName: string;
  clientType?: 'personal' | 'organization';
  dateOfBirth?: Date;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed' | 'separated';
  company?: string;
  contacts: IClientContact[];
  address?: IAddress;
  primaryAttorney?: string | IUserDocument;
  referralSource?: string;
  intakeDate: Date;
  notes?: string;
  tags?: string[];
  isActive: boolean;
  kycVerified: boolean;
  kycDocuments?: string[];
  conflictCheckCompleted: boolean;
  conflictCheckNotes?: string;
  isDeleted?: boolean;
}

export interface IClientDocument extends IClient, Document {
  _id: string;
  fullName: string;
  createdAt: Date;
  updatedAt: Date;

   // Related collections that can be attached to a case object
 cases?: Array<import('./case.interface').ICaseDocument>;
 tasks?: Array<import('./task.interface').ITaskDocument>;
 documents?: Array<import('./document.interface').IDocumentDocument>;
}

export interface IClientModel extends Model<IClientDocument> {
  findByName(name: string): Promise<IClientDocument[]>;
}
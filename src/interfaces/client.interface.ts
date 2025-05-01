import { Document, Model } from 'mongoose';
import { IUserDocument } from './user.interface';

export interface IClientContact {
  _id: string;
  type: 'phone' | 'email' | 'address' | 'other';
  value: string;
  isPrimary?: boolean;
  notes?: string;
}

export interface IClientDocument {
  name: string;
  contactInfo: string;
  notes?: string;
}

export interface IClient {
  firstName: string;
  lastName: string;
  company?: string;
  contacts: IClientContact[];
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
}

export interface IClientModel extends Model<IClientDocument> {
  findByName(name: string): Promise<IClientDocument[]>;
}
import { Document } from 'mongoose';
import { IUserDocument } from './user.interface';
import { ICaseDocument } from './case.interface';

export enum DocumentType {
  PLEADING = 'pleading',
  MOTION = 'motion',
  BRIEF = 'brief',
  CORRESPONDENCE = 'correspondence',
  CONTRACT = 'contract',
  EVIDENCE = 'evidence',
  FORM = 'form',
  INVOICE = 'invoice',
  NOTE = 'note',
  OTHER = 'other',
  KYC = 'kyc'
}

export interface IDocumentVersion {
  version: number;
  fileName: string;
  filePath: string;
  uploadedBy: string | IUserDocument;
  uploadedAt: Date;
  notes?: string;
}

export interface IDocumentShare {
  _id?: string; // MongoDB automatically adds this when { _id: true } is set in the schema
  sharedWith: string; // Email or identifier
  sharedBy: string | IUserDocument;
  sharedAt: Date;
  accessLevel: 'view' | 'edit' | 'comment';
  expiresAt?: Date;
  accessToken?: string;
  isRevoked: boolean;
}

export interface IDocument {
  title: string;
  description?: string;
  documentType: DocumentType;
  case?: string | ICaseDocument;
  client?: string;
  tags?: string[];
  versions: IDocumentVersion[];
  currentVersion: number;
  createdBy: string | IUserDocument;
  sharedWith: IDocumentShare[];
  isTemplate: boolean;
  isDeleted: boolean;
}

export interface IDocumentDocument extends IDocument, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  addVersion(fileName: string, filePath: string, uploadedBy: string, notes?: string): void;
  shareDocument(sharedWith: string, sharedBy: string, accessLevel: 'view' | 'edit' | 'comment', expiresAt?: Date): IDocumentShare;
  revokeAccess(shareId: string): boolean;
}
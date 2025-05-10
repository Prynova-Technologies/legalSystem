/**
 * Document Types
 * Type definitions for document-related functionality
 */

// Import from the backend interface
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

export interface DocumentVersion {
  version: number;
  fileName: string;
  filePath: string;
  fileType?: string;
  fileSize?: number;
  uploadedBy: string;
  uploadedAt: Date;
  notes?: string;
}

export interface DocumentShare {
  _id?: string;
  sharedWith: string;
  sharedBy: string;
  sharedAt: Date;
  accessLevel: 'view' | 'edit' | 'comment';
  expiresAt?: Date;
  accessToken?: string;
  isRevoked: boolean;
}

export interface Document {
  _id?: string;
  title: string;
  description?: string;
  documentType: DocumentType;
  case?: string;
  client?: string;
  tags?: string[];
  versions: DocumentVersion[];
  currentVersion: number;
  createdBy: string;
  sharedWith?: DocumentShare[];
  isTemplate: boolean;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DocumentUploadFormData {
  title: string;
  description?: string;
  documentType: DocumentType;
  client?: string;
  case?: string;
  tags?: string[];
  file?: File;
}
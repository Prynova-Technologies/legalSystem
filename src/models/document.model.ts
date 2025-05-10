import mongoose, { Schema } from 'mongoose';
import * as crypto from 'crypto';
import { IDocumentDocument, DocumentType } from '../interfaces/document.interface';

const documentVersionSchema = new Schema(
  {
    version: {
      type: Number,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    notes: String,
  },
  { _id: true }
);

const documentShareSchema = new Schema(
  {
    sharedWith: {
      type: String,
      required: true,
    },
    sharedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sharedAt: {
      type: Date,
      default: Date.now,
    },
    accessLevel: {
      type: String,
      enum: ['view', 'edit', 'comment'],
      default: 'view',
    },
    expiresAt: Date,
    accessToken: String,
    isRevoked: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const documentSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
    },
    description: String,
    documentType: {
      type: String,
      enum: Object.values(DocumentType),
      required: [true, 'Document type is required'],
    },
    case: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
    },
    tags: [String],
    versions: [documentVersionSchema],
    currentVersion: {
      type: Number,
      default: 1,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sharedWith: [documentShareSchema],
    isTemplate: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Method to add a new version to the document
documentSchema.methods.addVersion = function (
  fileName: string,
  filePath: string,
  uploadedBy: string,
  notes?: string
) {
  const newVersion = this.currentVersion + 1;
  
  this.versions.push({
    version: newVersion,
    fileName,
    filePath,
    uploadedBy,
    uploadedAt: new Date(),
    notes,
  });
  
  this.currentVersion = newVersion;
};

// Method to share document with someone
documentSchema.methods.shareDocument = function (
  sharedWith: string,
  sharedBy: string,
  accessLevel: 'view' | 'edit' | 'comment',
  expiresAt?: Date
) {
  // Generate a secure access token
  const accessToken = crypto.randomBytes(32).toString('hex');
  
  const share = {
    sharedWith,
    sharedBy,
    sharedAt: new Date(),
    accessLevel,
    expiresAt,
    accessToken,
    isRevoked: false,
  };
  
  this.sharedWith.push(share);
  return share;
};

// Method to revoke access
documentSchema.methods.revokeAccess = function (shareId: string): boolean {
  const share = this.sharedWith.id(shareId);
  if (!share) return false;
  
  share.isRevoked = true;
  return true;
};

// Indexes for efficient queries
documentSchema.index({ title: 'text', description: 'text', tags: 'text' });
documentSchema.index({ case: 1 });
documentSchema.index({ client: 1 });
documentSchema.index({ documentType: 1 });
documentSchema.index({ createdBy: 1 });
documentSchema.index({ 'sharedWith.sharedWith': 1 });

const Document = mongoose.model<IDocumentDocument>('Document', documentSchema);

export default Document;
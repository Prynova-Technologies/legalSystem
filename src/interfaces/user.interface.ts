import { Document, Model } from 'mongoose';

export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  isActive: boolean;
  lastLogin?: Date;
  passwordChangedAt?: Date;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
}

export interface IUserDocument extends IUser, Document {
  _id: string;
  fullName: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  changedPasswordAfter(timestamp: number): boolean;
  createPasswordResetToken(): string;
}

export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
}

export enum UserRole {
  ADMIN = 'admin',
  LAWYER = 'lawyer',
  PARALEGAL = 'paralegal',
  ASSISTANT = 'assistant',
  ACCOUNTANT = 'accountant',
  CLIENT = 'client'
}
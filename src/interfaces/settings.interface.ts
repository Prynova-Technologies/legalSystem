import { Document, Model } from 'mongoose';

export interface ISettings extends Document {
  companyName: string;
  email: string;
  phone: string;
  address: string;
  logo?: string;
  website?: string;
  emailSettings: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    smtpSecure: boolean;
    emailFrom: string;
  };
  notificationSettings: {
    sendInvoiceNotifications: boolean;
    sendCaseUpdateNotifications: boolean;
    sendDocumentNotifications: boolean;
    sendAppointmentReminders: boolean;
  };
  billingRates?: Array<{
    name: string;
    rate: number;
    description?: string;
  }>;
  documentTypes?: Array<{
    name: string;
    category?: string;
    description?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISettingsModel extends Model<ISettings> {
  findOneOrCreate(): Promise<ISettings>;
}